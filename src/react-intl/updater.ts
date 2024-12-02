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
    const stringMap = new Map<string, StringInfo>();
    strings.forEach((strInfo) => {
      stringMap.set(strInfo.string, strInfo);
    });

    let needsFormattedMessageImport = false;
    let needsUseIntlImport = false;

    traverse(ast, {
      Program: (path) => {
        this.ensureImports(path);
      },

      FunctionDeclaration: (path) => {
        const componentName = path.node.id?.name;
        if (componentName) {
          this.injectUseIntlHook(path);
        }
      },

      VariableDeclarator: (path) => {
        const id = path.node.id;
        const init = path.node.init;

        if (
          t.isIdentifier(id) &&
          (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init))
        ) {
          this.injectUseIntlHook(path);
        }
      },

      JSXElement: (path) => {
        this.replaceJSXElementStrings(path, stringMap);
        needsFormattedMessageImport = true;
      },

      JSXAttribute: (path) => {
        this.replaceJSXAttributeStrings(path, stringMap);
      },

      JSXExpressionContainer: (path) => {
        this.replaceExpressionStrings(path, stringMap);
        needsUseIntlImport = true;
      },
    });

    const output = generate(ast, { retainLines: true }, this.sourceCode);

    return output.code;
  }

  private ensureImports(path: babelTraverse.NodePath<t.Program>) {
    const body = path.node.body;

    const hasFormattedMessageImport = body.some(
      (node) =>
        t.isImportDeclaration(node) &&
        node.source.value === 'react-intl' &&
        node.specifiers.some(
          (spec) =>
            t.isImportSpecifier(spec) &&
            t.isIdentifier(spec.imported, { name: 'FormattedMessage' })
        )
    );

    const hasUseIntlImport = body.some(
      (node) =>
        t.isImportDeclaration(node) &&
        node.source.value === 'react-intl' &&
        node.specifiers.some(
          (spec) =>
            t.isImportSpecifier(spec) &&
            t.isIdentifier(spec.imported, { name: 'useIntl' })
        )
    );

    if (!hasFormattedMessageImport) {
      const importDeclaration = t.importDeclaration(
        [
          t.importSpecifier(
            t.identifier('FormattedMessage'),
            t.identifier('FormattedMessage')
          ),
        ],
        t.stringLiteral('react-intl')
      );
      path.unshiftContainer('body', importDeclaration);
    }

    if (!hasUseIntlImport) {
      const importDeclaration = t.importDeclaration(
        [t.importSpecifier(t.identifier('useIntl'), t.identifier('useIntl'))],
        t.stringLiteral('react-intl')
      );
      path.unshiftContainer('body', importDeclaration);
    }
  }

  private injectUseIntlHook(
    path: babelTraverse.NodePath<t.FunctionDeclaration | t.VariableDeclarator>
  ) {
    let body: t.BlockStatement | null = null;

    if (t.isFunctionDeclaration(path.node)) {
      body = path.node.body;
    } else if (
      t.isVariableDeclarator(path.node) &&
      (t.isArrowFunctionExpression(path.node.init) ||
        t.isFunctionExpression(path.node.init))
    ) {
      const func = path.node.init as
        | t.FunctionExpression
        | t.ArrowFunctionExpression;

      if (t.isBlockStatement(func.body)) {
        body = func.body;
      } else {
        func.body = t.blockStatement([
          t.returnStatement(func.body as t.Expression),
        ]);
        body = func.body;
      }
    }

    if (body) {
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
      }
    }
  }

  private replaceJSXElementStrings(
    path: babelTraverse.NodePath<t.JSXElement>,
    stringMap: Map<string, StringInfo>
  ) {
    path.node.children = path.node.children.map((child) => {
      if (t.isJSXText(child)) {
        const textValue = child.value.trim();
        if (stringMap.has(textValue)) {
          const strInfo = stringMap.get(textValue)!;

          return t.jsxElement(
            t.jsxOpeningElement(
              t.jsxIdentifier('FormattedMessage'),
              [
                t.jsxAttribute(
                  t.jsxIdentifier('id'),
                  t.stringLiteral(strInfo.identifier)
                ),
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
        }
      }
      return child;
    });
  }

  private replaceJSXAttributeStrings(
    path: babelTraverse.NodePath<t.JSXAttribute>,
    stringMap: Map<string, StringInfo>
  ) {
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
              t.objectProperty(
                t.identifier('defaultMessage'),
                t.stringLiteral(strInfo.string)
              ),
            ]),
          ]
        );

        path.node.value = t.jsxExpressionContainer(formatMessageCall);
      }
    }
  }

  private replaceExpressionStrings(
    path: babelTraverse.NodePath<t.JSXExpressionContainer>,
    stringMap: Map<string, StringInfo>
  ) {
    const expression = path.node.expression;

    if (t.isStringLiteral(expression)) {
      const textValue = expression.value.trim();

      if (stringMap.has(textValue)) {
        const strInfo = stringMap.get(textValue)!;

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
              t.objectProperty(
                t.identifier('defaultMessage'),
                t.stringLiteral(strInfo.string)
              ),
            ]),
          ]
        );

        path.replaceWith(t.jsxExpressionContainer(formatMessageCall));
      }
    }
  }
}
