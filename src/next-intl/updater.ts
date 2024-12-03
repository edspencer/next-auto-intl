// libraries/nextIntlUpdater.ts

import * as babelParser from '@babel/parser';
import * as babelTraverse from '@babel/traverse';
import * as t from '@babel/types';
import * as babelGenerate from '@babel/generator';
import { BaseUpdater } from '../updater/baseUpdater';
import { StringInfo } from '../types';

let traverse = babelTraverse.default || babelTraverse;
traverse = (traverse as any).default || traverse;

let generate = babelGenerate.default || babelGenerate;
generate = (generate as any).default || generate;

export class NextIntlUpdater extends BaseUpdater {
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

    traverse(ast, {
      Program: (path) => {
        // Check if 'useTranslations' is imported from 'next-intl'
        const hasUseTranslationsImport = path.node.body.some(
          (node) =>
            t.isImportDeclaration(node) &&
            node.source.value === 'next-intl' &&
            node.specifiers.some(
              (spec) =>
                t.isImportSpecifier(spec) &&
                t.isIdentifier(spec.imported, { name: 'useTranslations' })
            )
        );

        // If not, add the import at the top
        if (!hasUseTranslationsImport) {
          const importDeclaration = t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier('useTranslations'),
                t.identifier('useTranslations')
              ),
            ],
            t.stringLiteral('next-intl')
          );
          path.unshiftContainer('body', importDeclaration);
        }
      },

      // Handle function components (FunctionDeclaration)
      FunctionDeclaration: (path) => {
        const node = path.node;
        const componentName = node.id?.name;

        if (componentName && componentNames.has(componentName)) {
          this.injectUseTranslationsHook(path, componentName);
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

          this.injectUseTranslationsHook(path, componentName);
        }
      },

      // Replace strings in JSX elements and attributes
      JSXElement: (path) => {
        const element = path.node;

        // Replace strings in children
        element.children.forEach((child, index) => {
          if (t.isJSXText(child)) {
            const textValue = child.value.trim();

            if (stringMap.has(textValue)) {
              const strInfo = stringMap.get(textValue)!;
              element.children[index] = t.jsxExpressionContainer(
                t.callExpression(t.identifier('t'), [
                  t.stringLiteral(strInfo.identifier),
                ])
              );
            }
          }
        });

        // Replace strings in attributes
        element.openingElement.attributes.forEach((attr) => {
          if (
            t.isJSXAttribute(attr) &&
            t.isJSXIdentifier(attr.name) &&
            (t.isStringLiteral(attr.value) ||
              (t.isJSXExpressionContainer(attr.value) &&
                t.isStringLiteral(attr.value.expression)))
          ) {
            let attrValue: string | null = null;

            if (t.isStringLiteral(attr.value)) {
              attrValue = attr.value.value;
            } else if (
              t.isJSXExpressionContainer(attr.value) &&
              t.isStringLiteral(attr.value.expression)
            ) {
              attrValue = attr.value.expression.value;
            }

            if (attrValue && stringMap.has(attrValue)) {
              const strInfo = stringMap.get(attrValue)!;
              attr.value = t.jsxExpressionContainer(
                t.callExpression(t.identifier('t'), [
                  t.stringLiteral(strInfo.identifier),
                ])
              );
            }
          }
        });
      },

      // Replace strings within JSXExpressionContainer nodes
      JSXExpressionContainer: (path) => {
        const expression = path.node.expression;

        if (t.isStringLiteral(expression)) {
          const textValue = expression.value.trim();

          if (stringMap.has(textValue)) {
            const strInfo = stringMap.get(textValue)!;
            path.replaceWith(
              t.jsxExpressionContainer(
                t.callExpression(t.identifier('t'), [
                  t.stringLiteral(strInfo.identifier),
                ])
              )
            );
          }
        }
      },
    });

    const output = generate(ast, { retainLines: true }, this.sourceCode);

    return output.code;
  }

  /**
   * Injects the `useTranslations` hook into the component.
   */
  private injectUseTranslationsHook(path: any, componentName: string) {
    let body: t.BlockStatement | null = null;

    if (t.isFunctionDeclaration(path.node)) {
      body = path.node.body;
    } else if (
      t.isVariableDeclarator(path.node) &&
      (t.isArrowFunctionExpression(path.node.init) ||
        t.isFunctionExpression(path.node.init))
    ) {
      body = path.node.init.body as t.BlockStatement;
    }

    if (body && t.isBlockStatement(body)) {
      const hasUseTranslations = body.body.some(
        (node) =>
          t.isVariableDeclaration(node) &&
          node.declarations.some(
            (decl) =>
              t.isVariableDeclarator(decl) &&
              t.isIdentifier(decl.id, { name: 't' })
          )
      );

      if (!hasUseTranslations) {
        const tDeclaration = t.variableDeclaration('const', [
          t.variableDeclarator(
            t.identifier('t'),
            t.callExpression(t.identifier('useTranslations'), [
              t.stringLiteral(componentName),
            ])
          ),
        ]);
        body.body.unshift(tDeclaration);
      }
    }
  }
}
