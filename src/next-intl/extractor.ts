import * as babelTraverse from '@babel/traverse';
import * as t from '@babel/types';
import { BaseExtractor } from '../extractor/baseExtractor';
import { StringInfo, MessagesObject } from '../types';

let traverse = babelTraverse.default || babelTraverse;
traverse = (traverse as any).default || traverse;

export class NextIntlExtractor extends BaseExtractor {
  extractStrings(): StringInfo[] {
    const strings: StringInfo[] = [];
    this.collectComponentScopes();

    const visitedNodes: Set<t.Node> = new Set();

    traverse(this.ast, {
      JSXElement: (path) => {
        const componentName = this.getNearestComponentName(path);

        path.traverse({
          JSXText: (textPath) => {
            // Skip visited nodes
            if (visitedNodes.has(textPath.node)) return;

            const parent = textPath.parent;

            // Ensure the parent is a JSXElement
            if (!t.isJSXElement(parent)) return;

            // Determine if the text node is the only child of its parent
            const isOnlyChild =
              parent.children.filter((child) => t.isJSXText(child)).length ===
              1;

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
              const stringInfo = this.createStringInfo(
                componentName,
                textValue
              );
              strings.push(stringInfo);
            }

            // Mark the node as visited
            visitedNodes.add(textPath.node);
          },

          JSXAttribute: (attrPath) => {
            const { name, value } = attrPath.node;

            // Skip visited nodes
            if (visitedNodes.has(attrPath.node)) return;

            if (
              !t.isJSXIdentifier(name) ||
              !this.isUserFacingAttribute(name.name)
            ) {
              return;
            }

            if (t.isStringLiteral(value)) {
              const textValue = value.value;

              // Ensure the string contains at least one alphabetic character
              if (/[a-zA-Z]/.test(textValue)) {
                const stringInfo = this.createStringInfo(
                  componentName,
                  textValue
                );
                strings.push(stringInfo);
              }

              // Mark the node as visited
              visitedNodes.add(attrPath.node);
            } else if (
              t.isJSXExpressionContainer(value) &&
              t.isStringLiteral(value.expression)
            ) {
              const textValue = value.expression.value;

              // Ensure the string contains at least one alphabetic character
              if (/[a-zA-Z]/.test(textValue)) {
                const stringInfo = this.createStringInfo(
                  componentName,
                  textValue
                );
                strings.push(stringInfo);
              }

              // Mark the node and its expression as visited
              visitedNodes.add(attrPath.node);
              visitedNodes.add(value.expression);
            }
          },

          JSXExpressionContainer: (exprPath) => {
            const expression = exprPath.node.expression;

            // Skip visited nodes
            if (visitedNodes.has(exprPath.node)) return;

            if (t.isStringLiteral(expression)) {
              // Handle string literals like {'text'}
              const textValue = expression.value.trim();

              // Ensure the string contains at least one alphabetic character
              if (textValue && /[a-zA-Z]/.test(textValue)) {
                const stringInfo = this.createStringInfo(
                  componentName,
                  textValue
                );
                strings.push(stringInfo);
              }

              // Mark the node and its expression as visited
              visitedNodes.add(exprPath.node);
              visitedNodes.add(expression);
            } else if (t.isTemplateLiteral(expression)) {
              // Handle template literals like {`template string`}
              expression.quasis.forEach((quasi) => {
                const rawText = quasi.value.raw;

                // Normalize spaces and check for alphabetic characters
                const textValue = rawText
                  .replace(/^\s+/, ' ')
                  .replace(/\s+$/, ' ');

                if (textValue && /[a-zA-Z]/.test(textValue)) {
                  const stringInfo = this.createStringInfo(
                    componentName,
                    textValue,
                    { isExpression: true }
                  );
                  strings.push(stringInfo);
                }
              });

              // Mark the node and its expression as visited
              visitedNodes.add(exprPath.node);
              visitedNodes.add(expression);
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
                this.baseLanguageStrings[componentName] || {};
              const originalText = existingComponentTranslations[identifier];

              if (originalText) {
                strings.push({
                  file: this.filePath,
                  componentName,
                  string: originalText,
                  identifier,
                  alreadyUpdated: true,
                });

                // Mark the node and its expression as visited
                visitedNodes.add(exprPath.node);
                visitedNodes.add(expression);
              }
            }
          },
        });
      },
    });

    return strings;
  }
}
