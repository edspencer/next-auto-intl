import { parse } from '@babel/parser';
import * as babelGenerate from '@babel/generator';
import * as babelTraverse from '@babel/traverse';
import * as t from '@babel/types';

let traverse = babelTraverse.default || babelTraverse;
traverse = (traverse as any).default || traverse;

let generate = babelGenerate.default || babelGenerate;
generate = (generate as any).default || generate;

import { ComponentStrings } from '../types';

/**
 * Updates the source file by adding necessary imports, injecting translation hooks,
 * and replacing static strings with translation function calls.
 *
 * @param source - The source code of the file to be updated.
 * @param componentStrings - An object containing the component name and an array of strings to be translated.
 * @returns The updated source code with translations.
 *
 * The function performs the following tasks:
 * 1. Parses the source code into an AST.
 * 2. Traverses the AST to:
 *    - Check and add `useTranslations` import from 'next-intl' if not already present.
 *    - Inject `const t = useTranslations('Namespace');` at the top of the specified component function.
 *    - Replace static strings in JSX elements with calls to the translation function `t`.
 */
export function updateSourceNo(
  source: string,
  componentStrings: ComponentStrings
): string {
  const { componentName, strings } = componentStrings;

  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  traverse(ast, {
    Program(path) {
      // Check and add `useTranslations` import
      const hasUseTranslationsImport = path.node.body.some(
        (node) =>
          t.isImportDeclaration(node) &&
          node.source.value === 'next-intl' &&
          node.specifiers.some(
            (spec) =>
              t.isImportSpecifier(spec) &&
              t.isIdentifier(spec.imported) &&
              spec.imported.name === 'useTranslations'
          )
      );

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
        path.node.body.unshift(importDeclaration);
      }
    },

    FunctionDeclaration(path) {
      if (!t.isIdentifier(path.node.id) || path.node.id.name !== componentName)
        return;

      // Add `const t = useTranslations('Namespace');` at the top of the function body
      const hasUseTranslations = path.node.body.body.some(
        (node) =>
          t.isVariableDeclaration(node) &&
          node.declarations.some(
            (decl) =>
              t.isVariableDeclarator(decl) &&
              t.isIdentifier(decl.id) &&
              decl.id.name === 't'
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
        path.node.body.body.unshift(tDeclaration);
      }
    },

    VariableDeclarator(path) {
      if (
        t.isIdentifier(path.node.id) &&
        path.node.id.name === componentName &&
        t.isArrowFunctionExpression(path.node.init)
      ) {
        const body = path.node.init.body;

        // Ensure the body is a block statement (arrow functions with implicit returns won't work here)
        if (!t.isBlockStatement(body)) {
          // Convert the implicit return to a block statement
          path.node.init.body = t.blockStatement([t.returnStatement(body)]);
        }

        const blockBody = path.node.init.body as t.BlockStatement;

        const hasUseTranslations = blockBody.body.some(
          (node) =>
            t.isVariableDeclaration(node) &&
            node.declarations.some(
              (decl) =>
                t.isVariableDeclarator(decl) &&
                t.isIdentifier(decl.id) &&
                decl.id.name === 't'
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
          blockBody.body.unshift(tDeclaration);
        }
      }
    },

    JSXElement(path) {
      // Replace detected strings in children with translations
      path.node.children.forEach((child, index) => {
        if (t.isJSXText(child)) {
          const textValue = child.value.trim();

          const componentString = strings.find(
            ({ string }) => string === textValue
          );

          if (textValue && componentString) {
            path.node.children[index] = t.jsxExpressionContainer(
              t.callExpression(t.identifier('t'), [
                t.stringLiteral(componentString.identifier),
              ])
            );
          }
        }
      });

      // Replace detected strings in attributes with translations
      path.node.openingElement.attributes.forEach((attr) => {
        if (
          t.isJSXAttribute(attr) &&
          t.isJSXIdentifier(attr.name) &&
          t.isStringLiteral(attr.value)
        ) {
          const attrValue = attr.value.value;

          const componentString = strings.find(
            ({ string }) => string === attrValue
          );

          if (componentString) {
            attr.value = t.jsxExpressionContainer(
              t.callExpression(t.identifier('t'), [
                t.stringLiteral(componentString.identifier),
              ])
            );
          }
        }
      });
    },

    JSXExpressionContainer(path) {
      // Replace strings within JSXExpressionContainer
      const expression = path.node.expression;

      if (t.isStringLiteral(expression)) {
        const textValue = expression.value.trim();

        const componentString = strings.find(
          ({ string }) => string === textValue
        );

        if (textValue && componentString) {
          path.replaceWith(
            t.jsxExpressionContainer(
              t.callExpression(t.identifier('t'), [
                t.stringLiteral(componentString.identifier),
              ])
            )
          );
        }
      }
    },
  });

  return generate(ast).code;
}
