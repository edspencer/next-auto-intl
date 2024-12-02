import * as babelParser from '@babel/parser';
import * as babelTraverse from '@babel/traverse';
import * as t from '@babel/types';
import * as babelGenerate from '@babel/generator';
import { BaseUpdater } from '../updater/baseUpdater';
import { StringInfo } from '../types';

const traverse = babelTraverse.default || babelTraverse;
const generate = babelGenerate.default || babelGenerate;

export class ReactIntlUpdater extends BaseUpdater {
  updateSource(): string {
    const ast = babelParser.parse(this.sourceCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    const { strings } = this;
    const componentNames = new Set(strings.map((str) => str.componentName));
    const stringMap = new Map<string, StringInfo>();
    strings.forEach((strInfo) => {
      stringMap.set(strInfo.string, strInfo);
    });

    let needsFormattedMessageImport = false;
    let needsUseIntlImport = false;

    try {
      traverse(ast, {
        Program: (path) => {
          // We'll add imports at the end based on flags
        },

        // Handle function components (FunctionDeclaration)
        FunctionDeclaration: (path) => {
          const node = path.node;
          const componentName = node.id?.name;

          if (componentName && componentNames.has(componentName)) {
            const didInject = this.injectUseIntlHook(path, componentName);
            if (didInject) needsUseIntlImport = true;
          }
        },

        // Handle arrow function components assigned to variables (VariableDeclarator)
        VariableDeclarator: (path) => {
          const node = path.node;
          const id = node.id;
          const init = node.init;

          if (
            t.isIdentifier(id) &&
            componentNames.has(id.name) &&
            (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init))
          ) {
            const componentName = id.name;
            const functionBody = init.body;

            // Ensure the function body is a BlockStatement
            if (!t.isBlockStatement(functionBody)) {
              init.body = t.blockStatement([
                t.returnStatement(functionBody as t.Expression),
              ]);
            }

            const didInject = this.injectUseIntlHook(path, componentName);
            if (didInject) needsUseIntlImport = true;
          }
        },

        JSXElement: (path) => {
          const didReplace = this.replaceJSXElementStrings(path, stringMap);
          if (didReplace) needsFormattedMessageImport = true;
        },

        JSXAttribute: (path) => {
          // Skip if we're inside a FormattedMessage component
          if (this.isInFormattedMessage(path)) return;

          const didReplace = this.replaceJSXAttributeStrings(path, stringMap);
          if (didReplace) needsUseIntlImport = true;
        },

        JSXExpressionContainer: (path) => {
          // Skip if we're inside a FormattedMessage component
          if (this.isInFormattedMessage(path)) return;

          const didReplace = this.replaceExpressionStrings(path, stringMap);
          if (didReplace) needsFormattedMessageImport = true;
        },
      });

      // After traversal, add imports if necessary
      traverse(ast, {
        Program: (path) => {
          this.ensureImports(
            path,
            needsFormattedMessageImport,
            needsUseIntlImport
          );
        },
      });
    } catch (error: any) {
      console.error(`Error during AST traversal: ${error.message}`);
    }

    const output = generate(ast, { retainLines: true }, this.sourceCode);

    return output.code;
  }

  private ensureImports(
    path: babelTraverse.NodePath<t.Program>,
    needsFormattedMessageImport: boolean,
    needsUseIntlImport: boolean
  ) {
    const body = path.node.body;

    // Find existing import declaration from 'react-intl'
    const reactIntlImport = body.find(
      (node): node is t.ImportDeclaration =>
        t.isImportDeclaration(node) && node.source.value === 'react-intl'
    );

    if (reactIntlImport) {
      // Collect existing imported specifiers
      const existingSpecifiers = new Set<string>();
      reactIntlImport.specifiers.forEach((spec) => {
        if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
          existingSpecifiers.add(spec.imported.name);
        }
      });

      // Add missing specifiers
      const newSpecifiers: t.ImportSpecifier[] = [];

      if (
        needsFormattedMessageImport &&
        !existingSpecifiers.has('FormattedMessage')
      ) {
        newSpecifiers.push(
          t.importSpecifier(
            t.identifier('FormattedMessage'),
            t.identifier('FormattedMessage')
          )
        );
      }

      if (needsUseIntlImport && !existingSpecifiers.has('useIntl')) {
        newSpecifiers.push(
          t.importSpecifier(t.identifier('useIntl'), t.identifier('useIntl'))
        );
      }

      reactIntlImport.specifiers.push(...newSpecifiers);
    } else {
      // No existing import, create a new one
      const specifiers: t.ImportSpecifier[] = [];

      if (needsFormattedMessageImport) {
        specifiers.push(
          t.importSpecifier(
            t.identifier('FormattedMessage'),
            t.identifier('FormattedMessage')
          )
        );
      }

      if (needsUseIntlImport) {
        specifiers.push(
          t.importSpecifier(t.identifier('useIntl'), t.identifier('useIntl'))
        );
      }

      if (specifiers.length > 0) {
        const importDeclaration = t.importDeclaration(
          specifiers,
          t.stringLiteral('react-intl')
        );
        path.unshiftContainer('body', importDeclaration);
      }
    }
  }

  private injectUseIntlHook(
    path: babelTraverse.NodePath<t.FunctionDeclaration | t.VariableDeclarator>,
    componentName: string
  ): boolean {
    let body: t.BlockStatement | null = null;
    let functionNode:
      | t.FunctionDeclaration
      | t.FunctionExpression
      | t.ArrowFunctionExpression
      | null = null;

    if (t.isFunctionDeclaration(path.node)) {
      functionNode = path.node;
      body = path.node.body;
    } else if (
      t.isVariableDeclarator(path.node) &&
      (t.isArrowFunctionExpression(path.node.init) ||
        t.isFunctionExpression(path.node.init))
    ) {
      functionNode = path.node.init as
        | t.FunctionExpression
        | t.ArrowFunctionExpression;
      body = functionNode.body as t.BlockStatement;
    }

    if (body && t.isBlockStatement(body) && functionNode) {
      const hasUseIntl = body.body.some(
        (node) =>
          t.isVariableDeclaration(node) &&
          node.declarations.some(
            (decl) =>
              t.isVariableDeclarator(decl) &&
              t.isIdentifier(decl.id, { name: 'intl' })
          )
      );

      if (!hasUseIntl) {
        const intlDeclaration = t.variableDeclaration('const', [
          t.variableDeclarator(
            t.identifier('intl'),
            t.callExpression(t.identifier('useIntl'), [])
          ),
        ]);
        body.body.unshift(intlDeclaration);
        return true; // Indicate that we injected useIntl
      }
    }
    return false;
  }

  private replaceJSXElementStrings(
    path: babelTraverse.NodePath<t.JSXElement>,
    stringMap: Map<string, StringInfo>
  ): boolean {
    let didReplace = false;

    path.get('children').forEach((childPath) => {
      if (childPath.isJSXText()) {
        const textValue = childPath.node.value.trim();
        if (stringMap.has(textValue)) {
          const strInfo = stringMap.get(textValue)!;

          const formattedMessageElement = t.jsxElement(
            t.jsxOpeningElement(
              t.jsxIdentifier('FormattedMessage'),
              [
                t.jsxAttribute(
                  t.jsxIdentifier('id'),
                  t.stringLiteral(strInfo.identifier)
                ),
                // Omit defaultMessage if not needed
              ],
              true
            ),
            null,
            [],
            true
          );

          childPath.replaceWith(formattedMessageElement);

          // Skip traversal into the new node
          childPath.skip();

          didReplace = true;
        }
      }
    });

    return didReplace;
  }

  private replaceJSXAttributeStrings(
    path: babelTraverse.NodePath<t.JSXAttribute>,
    stringMap: Map<string, StringInfo>
  ): boolean {
    const attrName = path.node.name.name;
    const attrValue = path.node.value;

    if (
      t.isStringLiteral(attrValue) ||
      (t.isJSXExpressionContainer(attrValue) &&
        t.isStringLiteral(attrValue.expression))
    ) {
      const value = t.isStringLiteral(attrValue)
        ? attrValue.value
        : (attrValue.expression as t.StringLiteral).value;

      if (stringMap.has(value)) {
        const strInfo = stringMap.get(value)!;

        // For attributes like 'title', 'alt', we can use intl.formatMessage
        const formatMessageCall = t.callExpression(
          t.memberExpression(
            t.identifier('intl'),
            t.identifier('formatMessage')
          ),
          [
            t.objectExpression([
              t.objectProperty(
                t.identifier('id'),
                t.stringLiteral(strInfo.identifier)
              ),
              // Omit defaultMessage if not needed
            ]),
          ]
        );

        path.node.value = t.jsxExpressionContainer(formatMessageCall);

        return true; // Indicate that we made a replacement
      }
    }

    return false;
  }

  private replaceExpressionStrings(
    path: babelTraverse.NodePath<t.JSXExpressionContainer>,
    stringMap: Map<string, StringInfo>
  ): boolean {
    const expression = path.node.expression;

    if (t.isStringLiteral(expression)) {
      const textValue = expression.value.trim();

      if (stringMap.has(textValue)) {
        const strInfo = stringMap.get(textValue)!;

        // Determine the context in which the JSXExpressionContainer is used
        const parentPath = path.parentPath;

        if (parentPath.isJSXElement() || parentPath.isJSXFragment()) {
          // If it's used as a child, replace with <FormattedMessage />
          const formattedMessageElement = t.jsxElement(
            t.jsxOpeningElement(
              t.jsxIdentifier('FormattedMessage'),
              [
                t.jsxAttribute(
                  t.jsxIdentifier('id'),
                  t.stringLiteral(strInfo.identifier)
                ),
                // Omit defaultMessage if not needed
              ],
              true
            ),
            null,
            [],
            true
          );

          path.replaceWith(formattedMessageElement);

          // Skip traversal into the new node
          path.skip();

          return true; // Indicate that we made a replacement
        } else {
          // Otherwise, use intl.formatMessage
          const formatMessageCall = t.callExpression(
            t.memberExpression(
              t.identifier('intl'),
              t.identifier('formatMessage')
            ),
            [
              t.objectExpression([
                t.objectProperty(
                  t.identifier('id'),
                  t.stringLiteral(strInfo.identifier)
                ),
                // Omit defaultMessage if not needed
              ]),
            ]
          );

          path.replaceWith(t.jsxExpressionContainer(formatMessageCall));

          return true; // Indicate that we made a replacement
        }
      }
    }

    return false;
  }

  private isInFormattedMessage(path: babelTraverse.NodePath): boolean {
    return path.findParent(
      (p) =>
        p.isJSXElement() &&
        t.isJSXIdentifier(p.node.openingElement.name, {
          name: 'FormattedMessage',
        })
    )
      ? true
      : false;
  }
}
