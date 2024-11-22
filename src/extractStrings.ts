import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { StringInfo } from './types';
import slugify from 'slugify';

export function extractStrings(ast: t.File, filePath: string): StringInfo[] {
  const strings: StringInfo[] = [];
  const componentScopes: Map<
    string,
    t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression
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

          const textValue = textPath.node.value.trim();
          if (textValue) {
            strings.push(createStringInfo(filePath, componentName, textValue));
          }

          // Mark the node as visited
          visitedNodes.push(textPath.node);
        },
        JSXAttribute(attrPath) {
          const { name, value } = attrPath.node;

          if (!t.isJSXIdentifier(name) || !isUserFacingAttribute(name.name))
            return;

          if (t.isStringLiteral(value)) {
            strings.push(
              createStringInfo(filePath, componentName, value.value)
            );
          } else if (
            t.isJSXExpressionContainer(value) &&
            t.isStringLiteral(value.expression)
          ) {
            strings.push(
              createStringInfo(filePath, componentName, value.expression.value)
            );
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

  let containsJSX = false;

  // Traverse the block statement or expression to find JSXElement
  if (t.isBlockStatement(body)) {
    body.body.forEach((statement) => {
      if (
        t.isExpressionStatement(statement) &&
        t.isJSXElement(statement.expression)
      ) {
        containsJSX = true;
      }
      if (
        t.isReturnStatement(statement) &&
        t.isJSXElement(statement.argument)
      ) {
        containsJSX = true;
      }
    });
  } else if (t.isJSXElement(body)) {
    containsJSX = true;
  }

  return containsJSX;
}

// Determine the nearest React component name for a JSXElement
function getNearestComponentName(
  path: any,
  componentScopes: Map<
    string,
    t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression
  >
): string {
  let currentPath = path;

  while (currentPath) {
    const parentNode = currentPath.parentPath?.node;

    // Match with collected component names
    if (
      t.isFunctionDeclaration(parentNode) &&
      parentNode.id &&
      componentScopes.has(parentNode.id.name)
    ) {
      return parentNode.id.name;
    }

    if (
      t.isVariableDeclarator(parentNode) &&
      t.isIdentifier(parentNode.id) &&
      componentScopes.has(parentNode.id.name)
    ) {
      return parentNode.id.name;
    }

    currentPath = currentPath.parentPath;
  }

  return 'UnknownComponent';
}

// Check if an attribute is user-facing
function isUserFacingAttribute(attrName: string): boolean {
  const userFacingAttributes = [
    'alt',
    'title',
    'placeholder',
    'aria-label',
    'aria-labelledby',
  ];
  return userFacingAttributes.includes(attrName);
}

// Create a StringInfo object
function createStringInfo(
  file: string,
  componentName: string,
  text: string
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
  };
}
