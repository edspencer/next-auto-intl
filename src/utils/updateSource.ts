import { parse } from '@babel/parser';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

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
export function updateSource(
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
              t.isIdentifier(spec.imported) && // Ensure `spec.imported` is an Identifier
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

    JSXElement(path) {
      // Replace detected strings with translations
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
    },
  });

  return generate(ast).code;
}
