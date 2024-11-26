import * as babelTraverse from '@babel/traverse';
import * as t from '@babel/types';
import { StringInfo, MessagesObject } from './types';
import slugify from 'slugify';

let traverse = babelTraverse.default || babelTraverse;
traverse = (traverse as any).default || traverse;

export function extractStrings(
  ast: t.File,
  filePath: string,
  baseLanguageStrings: MessagesObject
): StringInfo[] {
  const strings: StringInfo[] = [];
  const componentScopes: Map<
    string,
    | t.FunctionDeclaration
    | t.FunctionExpression
    | t.ArrowFunctionExpression
    | t.ClassDeclaration
  > = new Map();

  // 1. Collect all React component names in the file
  traverse(ast, {
    FunctionDeclaration(path) {
      const node = path.node;

      if (node.id && /^[A-Z]/.test(node.id.name)) {
        if (containsJSX(node.body)) {
          componentScopes.set(node.id.name, node);
        }
      }
    },
    FunctionExpression(path) {
      const parent = path.parentPath.node;
      if (
        t.isVariableDeclarator(parent) &&
        t.isIdentifier(parent.id) &&
        /^[A-Z]/.test(parent.id.name)
      ) {
        if (containsJSX(path.node.body)) {
          componentScopes.set(parent.id.name, path.node);
        }
      }
    },
    ArrowFunctionExpression(path) {
      const parent = path.parentPath.node;
      if (
        t.isVariableDeclarator(parent) &&
        t.isIdentifier(parent.id) &&
        /^[A-Z]/.test(parent.id.name)
      ) {
        if (containsJSX(path.node.body)) {
          componentScopes.set(parent.id.name, path.node);
        }
      }
    },
    ClassDeclaration(path) {
      const node = path.node;

      if (node.id && /^[A-Z]/.test(node.id.name)) {
        // Check if the class contains a `render` method with JSX
        const renderMethod = node.body.body.find(
          (bodyNode): bodyNode is t.ClassMethod =>
            t.isClassMethod(bodyNode) &&
            t.isIdentifier(bodyNode.key) &&
            bodyNode.key.name === 'render'
        );

        if (renderMethod && containsJSX(renderMethod.body)) {
          componentScopes.set(node.id.name, node);
        }
      }
    },
  });

  const visitedNodes: any[] = [];

  // 2. Traverse JSXElements and associate with component names
  traverse(ast, {
    JSXElement(path) {
      const componentName = getNearestComponentName(path, componentScopes);

      path.traverse({
        JSXText(textPath) {
          // Skip visited nodes
          if (visitedNodes.includes(textPath.node)) return;

          const parent = textPath.parent;

          // Ensure the parent is a JSXElement
          if (!t.isJSXElement(parent)) return;

          // Determine if the text node is the only child of its parent
          const isOnlyChild =
            parent.children.filter((child) => t.isJSXText(child)).length === 1;

          // Normalize the text value
          let textValue = textPath.node.value;
          if (isOnlyChild) {
            // If it's the only child, trim all whitespace
            textValue = textValue.trim();
          } else {
            // Otherwise, normalize spaces to preserve single leading/trailing spaces
            textValue = textValue
              .replace(/^\s+/, ' ')
              .replace(/\s+$/, ' ')
              .trimStart() // Handle excessive leading whitespace
              .trimEnd(); // Handle excessive trailing whitespace
          }

          // Ensure the string contains at least one alphabetic character
          if (textValue && /[a-zA-Z]/.test(textValue)) {
            strings.push(createStringInfo(filePath, componentName, textValue));
          }

          // Mark the node as visited
          visitedNodes.push(textPath.node);
        },

        JSXAttribute(attrPath) {
          const { name, value } = attrPath.node;

          // Skip visited nodes
          if (visitedNodes.includes(attrPath.node)) return;

          if (!t.isJSXIdentifier(name) || !isUserFacingAttribute(name.name)) {
            return;
          }

          if (t.isStringLiteral(value)) {
            // Ensure the string contains at least one alphabetic character
            if (/[a-zA-Z]/.test(value.value)) {
              strings.push(
                createStringInfo(filePath, componentName, value.value)
              );
            }

            // Mark the node as visited
            visitedNodes.push(attrPath.node);
          } else if (
            t.isJSXExpressionContainer(value) &&
            t.isStringLiteral(value.expression)
          ) {
            // Ensure the string contains at least one alphabetic character
            if (/[a-zA-Z]/.test(value.expression.value)) {
              strings.push(
                createStringInfo(
                  filePath,
                  componentName,
                  value.expression.value
                )
              );
            }

            // Mark the node and its expression as visited
            visitedNodes.push(attrPath.node);
            visitedNodes.push(value.expression);
          }
        },

        JSXExpressionContainer(exprPath) {
          const expression = exprPath.node.expression;

          // Skip visited nodes
          if (visitedNodes.includes(exprPath.node)) return;

          if (t.isStringLiteral(expression)) {
            // Handle string literals like {' instead.'}
            const textValue = expression.value.trim();

            // Ensure the string contains at least one alphabetic character
            if (textValue && /[a-zA-Z]/.test(textValue)) {
              strings.push(
                createStringInfo(filePath, componentName, textValue)
              );
            }

            // Mark the node and its expression as visited
            visitedNodes.push(exprPath.node);
            visitedNodes.push(expression);
          } else if (t.isTemplateLiteral(expression)) {
            // Handle template literals like {`Another tricky string with spaces and punctuation!`}
            expression.quasis.forEach((quasi) => {
              const rawText = quasi.value.raw;

              // Normalize spaces and check for alphabetic characters
              const textValue = rawText
                .replace(/^\s+/, ' ')
                .replace(/\s+$/, ' ');

              if (textValue && /[a-zA-Z]/.test(textValue)) {
                strings.push(
                  createStringInfo(filePath, componentName, textValue, {
                    isExpression: true,
                  })
                );
              }
            });

            // Mark the node and its expression as visited
            visitedNodes.push(exprPath.node);
            visitedNodes.push(expression);
          } else if (
            t.isCallExpression(expression) &&
            t.isIdentifier(expression.callee) &&
            expression.callee.name === 't' &&
            expression.arguments.length === 1 &&
            t.isStringLiteral(expression.arguments[0])
          ) {
            // Handle {t('someStringId')}
            const identifier = expression.arguments[0].value;
            const existingComponentTranslations =
              baseLanguageStrings[componentName] || {};
            const originalText = existingComponentTranslations[identifier];

            if (originalText) {
              strings.push({
                file: filePath,
                componentName,
                string: originalText,
                identifier,
                alreadyUpdated: true,
              });

              // Mark the node and its expression as visited
              visitedNodes.push(exprPath.node);
              visitedNodes.push(expression);
            }
          }
        },
      });
    },
  });

  return strings;
}

// Check if a function body contains JSX
function containsJSX(body: t.BlockStatement | t.Expression | null): boolean {
  if (!body) return false;

  let foundJSX = false;

  function checkNode(node: t.Node) {
    if (t.isJSXElement(node) || t.isJSXFragment(node)) {
      foundJSX = true;
    }
  }

  // Traverse block or expression to look for JSX
  if (t.isBlockStatement(body)) {
    body.body.forEach((statement) => {
      t.traverseFast(statement, checkNode);
    });
  } else {
    t.traverseFast(body, checkNode);
  }

  return foundJSX;
}

// Determine the nearest React component name for a JSXElement
function getNearestComponentName(
  path: any,
  componentScopes: Map<
    string,
    | t.FunctionDeclaration
    | t.FunctionExpression
    | t.ArrowFunctionExpression
    | t.ClassDeclaration
  >
): string {
  let currentPath = path;

  while (currentPath) {
    const parentNode = currentPath.parentPath?.node;

    // Check if the parentNode is one of the recorded function scopes
    if (t.isFunctionDeclaration(parentNode) && parentNode.id?.name) {
      if (componentScopes.has(parentNode.id.name)) {
        return parentNode.id.name;
      }
    }

    if (
      t.isVariableDeclarator(parentNode) &&
      t.isIdentifier(parentNode.id) &&
      componentScopes.has(parentNode.id.name)
    ) {
      return parentNode.id.name;
    }

    // Check if the parentNode is a ClassDeclaration
    if (t.isClassDeclaration(parentNode) && parentNode.id?.name) {
      if (componentScopes.has(parentNode.id.name)) {
        return parentNode.id.name;
      }
    }

    currentPath = currentPath.parentPath;
  }

  return 'UnknownComponent';
}

// Check if an attribute is user-facing
function isUserFacingAttribute(attrName: string): boolean {
  const userFacingAttributes = ['alt', 'title', 'placeholder', 'aria-label'];
  return userFacingAttributes.includes(attrName);
}

// Create a StringInfo object
function createStringInfo(
  file: string,
  componentName: string,
  text: string,
  options: any = {}
): StringInfo {
  const identifier = slugify(text, { lower: true, strict: true })
    .split('-')
    .slice(0, 5)
    .join('-');

  return {
    file,
    componentName,
    string: text,
    identifier,
    ...options,
  };
}
