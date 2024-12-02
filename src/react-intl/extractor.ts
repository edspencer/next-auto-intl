import * as babelTraverse from '@babel/traverse';
import * as t from '@babel/types';
import { BaseExtractor } from '../extractor/baseExtractor';
import { StringInfo, MessagesObject } from '../types';

let traverse = babelTraverse.default || babelTraverse;
traverse = (traverse as any).default || traverse;

export class ReactIntlExtractor extends BaseExtractor {
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

            const textValue = textPath.node.value.trim();

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
                const rawText = quasi.value.raw.trim();

                if (rawText && /[a-zA-Z]/.test(rawText)) {
                  const stringInfo = this.createStringInfo(
                    componentName,
                    rawText,
                    {
                      isExpression: true,
                    }
                  );
                  strings.push(stringInfo);
                }
              });

              // Mark the node and its expression as visited
              visitedNodes.add(exprPath.node);
              visitedNodes.add(expression);
            }
          },
        });
      },
    });

    return strings;
  }
}
