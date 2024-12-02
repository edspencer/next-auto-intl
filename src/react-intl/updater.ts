import * as babelParser from '@babel/parser';
import * as babelTraverse from '@babel/traverse';
import * as t from '@babel/types';
import * as babelGenerate from '@babel/generator';
import { BaseUpdater } from '../updater/baseUpdater';
import { StringInfo } from '../types';

const traverse = babelTraverse.default || babelTraverse;
const generate = babelGenerate.default || babelGenerate;

/**
 * Updates React components by replacing hardcoded strings
 * with React Intl components and functions for internationalization.
 */
export class ReactIntlUpdater extends BaseUpdater {
  /**
   * Updates the source code by replacing strings with internationalized versions.
   * @returns {string} The updated source code as a string.
   */
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
          // Imports will be added at the end based on flags
        },

        /**
         * Handles function components defined as FunctionDeclaration.
         * Injects useIntl hook if necessary.
         */
        FunctionDeclaration: (path) => {
          const node = path.node;
          const componentName = node.id?.name;

          if (componentName && componentNames.has(componentName)) {
            const didInject = this.injectUseIntlHook(path, componentName);
            if (didInject) needsUseIntlImport = true;
          }
        },

        /**
         * Handles function components defined as VariableDeclarator with function expressions.
         * Injects useIntl hook if necessary.
         */
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

        /**
         * Replaces JSXText nodes with FormattedMessage components.
         */
        JSXElement: (path) => {
          const didReplace = this.replaceJSXElementStrings(path, stringMap);
          if (didReplace) needsFormattedMessageImport = true;
        },

        /**
         * Replaces string literals in JSX attributes with intl.formatMessage calls.
         */
        JSXAttribute: (path) => {
          // Skip if we're inside a FormattedMessage component
          if (this.isInFormattedMessage(path)) return;

          const didReplace = this.replaceJSXAttributeStrings(path, stringMap);
          if (didReplace) needsUseIntlImport = true;
        },

        /**
         * Replaces string literals in JSXExpressionContainer nodes.
         */
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

  /**
   * Ensures that necessary imports from 'react-intl' are present.
   * Merges imports into a single line if possible.
   * @param path The Program node path.
   * @param needsFormattedMessageImport Whether 'FormattedMessage' needs to be imported.
   * @param needsUseIntlImport Whether 'useIntl' needs to be imported.
   */
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

  /**
   * Injects the 'useIntl' hook into the component function if not already present.
   * @param path The function node path (FunctionDeclaration or VariableDeclarator).
   * @param componentName The name of the component.
   * @returns {boolean} True if 'useIntl' was injected, false otherwise.
   */
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

  /**
   * Replaces JSXText nodes with FormattedMessage components where necessary.
   * @param path The JSXElement node path.
   * @param stringMap A map of strings to their corresponding StringInfo.
   * @returns {boolean} True if any replacements were made, false otherwise.
   */
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
                // include defaultMessage
                t.jsxAttribute(
                  t.jsxIdentifier('defaultMessage'),
                  t.stringLiteral(strInfo.string)
                ),
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

  /**
   * Replaces string literals in JSX attributes with intl.formatMessage calls.
   * @param path The JSXAttribute node path.
   * @param stringMap A map of strings to their corresponding StringInfo.
   * @returns {boolean} True if a replacement was made, false otherwise.
   */
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

        // Use intl.formatMessage for attributes
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
              // include defaultMessage
              t.objectProperty(
                t.identifier('defaultMessage'),
                t.stringLiteral(strInfo.string)
              ),
            ]),
          ]
        );

        path.node.value = t.jsxExpressionContainer(formatMessageCall);

        return true; // Indicate that a replacement was made
      }
    }

    return false;
  }

  /**
   * Replaces string literals in JSXExpressionContainer nodes with FormattedMessage components or intl.formatMessage calls.
   * @param path The JSXExpressionContainer node path.
   * @param stringMap A map of strings to their corresponding StringInfo.
   * @returns {boolean} True if a replacement was made, false otherwise.
   */
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
          // Replace with <FormattedMessage /> if used as a child
          const formattedMessageElement = t.jsxElement(
            t.jsxOpeningElement(
              t.jsxIdentifier('FormattedMessage'),
              [
                t.jsxAttribute(
                  t.jsxIdentifier('id'),
                  t.stringLiteral(strInfo.identifier)
                ),
                // include defaultMessage
                t.jsxAttribute(
                  t.jsxIdentifier('defaultMessage'),
                  t.stringLiteral(strInfo.string)
                ),
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

          return true; // Indicate that a replacement was made
        } else {
          // Use intl.formatMessage in other contexts
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
                // include defaultMessage
                t.objectProperty(
                  t.identifier('defaultMessage'),
                  t.stringLiteral(strInfo.string)
                ),
              ]),
            ]
          );

          path.replaceWith(t.jsxExpressionContainer(formatMessageCall));

          return true; // Indicate that a replacement was made
        }
      }
    }

    return false;
  }

  /**
   * Determines if the current path is within a FormattedMessage component.
   * Used to prevent processing nodes inside FormattedMessage.
   * @param path The current node path.
   * @returns {boolean} True if inside a FormattedMessage component, false otherwise.
   */
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
