import * as babelTraverse from '@babel/traverse';
import * as t from '@babel/types';
import { BaseExtractor } from '../extractor/baseExtractor';
import { StringInfo } from '../types';

let traverse = babelTraverse.default || babelTraverse;
traverse = (traverse as any).default || traverse;

export class ReactIntlExtractor extends BaseExtractor {
  extractStrings(): StringInfo[] {
    const strings: StringInfo[] = [];
    this.collectComponentScopes();

    const visitedNodes: Set<t.Node> = new Set();

    try {
      traverse(this.ast, {
        JSXElement: (path) => {
          const componentName = this.getNearestComponentName(path);

          path.traverse({
            JSXText: (textPath) => {
              if (visitedNodes.has(textPath.node)) return;

              const textValue = textPath.node.value.trim();

              if (textValue && /[a-zA-Z]/.test(textValue)) {
                const stringInfo = this.createStringInfo(
                  componentName,
                  textValue
                );
                strings.push(stringInfo);
              }

              visitedNodes.add(textPath.node);
            },

            JSXAttribute: (attrPath) => {
              const { name, value } = attrPath.node;

              if (visitedNodes.has(attrPath.node)) return;

              if (
                !t.isJSXIdentifier(name) ||
                !this.isUserFacingAttribute(name.name)
              ) {
                return;
              }

              if (t.isStringLiteral(value)) {
                const textValue = value.value;

                if (/[a-zA-Z]/.test(textValue)) {
                  const stringInfo = this.createStringInfo(
                    componentName,
                    textValue
                  );
                  strings.push(stringInfo);
                }

                visitedNodes.add(attrPath.node);
              } else if (t.isJSXExpressionContainer(value)) {
                const expression = value.expression;

                // Handle cases where the expression is a string literal
                if (t.isStringLiteral(expression)) {
                  const textValue = expression.value;

                  if (/[a-zA-Z]/.test(textValue)) {
                    const stringInfo = this.createStringInfo(
                      componentName,
                      textValue
                    );
                    strings.push(stringInfo);
                  }

                  visitedNodes.add(attrPath.node);
                  visitedNodes.add(expression);
                }
                // Handle cases where the expression is a call to intl.formatMessage
                else if (t.isCallExpression(expression)) {
                  this.handleIntlFormatMessageCall(
                    expression,
                    componentName,
                    strings,
                    visitedNodes,
                    attrPath.node // Pass attrPath.node as currentNode
                  );
                }
              }
            },

            JSXExpressionContainer: (exprPath) => {
              const expression = exprPath.node.expression;

              if (visitedNodes.has(exprPath.node)) return;

              if (t.isStringLiteral(expression)) {
                const textValue = expression.value.trim();

                if (textValue && /[a-zA-Z]/.test(textValue)) {
                  const stringInfo = this.createStringInfo(
                    componentName,
                    textValue
                  );
                  strings.push(stringInfo);
                }

                visitedNodes.add(exprPath.node);
                visitedNodes.add(expression);
              } else if (t.isTemplateLiteral(expression)) {
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

                visitedNodes.add(exprPath.node);
                visitedNodes.add(expression);
              }
              // Handle intl.formatMessage calls inside expressions
              else if (t.isCallExpression(expression)) {
                this.handleIntlFormatMessageCall(
                  expression,
                  componentName,
                  strings,
                  visitedNodes,
                  exprPath.node // Pass exprPath.node as currentNode
                );
              }
            },

            // Handle nested JSXElements, specifically FormattedMessage components
            JSXElement: (elementPath) => {
              const openingElement = elementPath.node.openingElement;

              // Ensure the opening element is a JSXOpeningElement
              if (!t.isJSXOpeningElement(openingElement)) return;

              if (visitedNodes.has(elementPath.node)) return;

              // Check if the element is a <FormattedMessage>
              if (
                t.isJSXIdentifier(openingElement.name) &&
                openingElement.name.name === 'FormattedMessage'
              ) {
                const idAttr = openingElement.attributes.find(
                  (attr) =>
                    t.isJSXAttribute(attr) &&
                    t.isJSXIdentifier(attr.name) &&
                    attr.name.name === 'id'
                );

                // Ensure the attribute is valid and contains a string literal value
                if (
                  idAttr &&
                  t.isJSXAttribute(idAttr) &&
                  t.isStringLiteral(idAttr.value)
                ) {
                  const idValue = idAttr.value.value;

                  const existingComponentTranslations =
                    this.baseLanguageStrings[componentName] || {};
                  const originalText = existingComponentTranslations[idValue];

                  if (originalText) {
                    strings.push({
                      file: this.filePath,
                      componentName,
                      string: originalText,
                      identifier: idValue,
                      alreadyUpdated: true,
                    });

                    visitedNodes.add(elementPath.node);
                  }
                }
              }
            },
          });
        },
      });
    } catch (error: any) {
      console.error(`Error during AST traversal: ${error.message}`);
    }

    return strings;
  }

  // Updated helper method to handle intl.formatMessage calls
  private handleIntlFormatMessageCall(
    expression: t.CallExpression,
    componentName: string,
    strings: StringInfo[],
    visitedNodes: Set<t.Node>,
    currentNode?: t.Node
  ) {
    // Check if we've already processed this expression
    if (visitedNodes.has(expression)) return;

    // Check if callee is intl.formatMessage
    if (
      t.isMemberExpression(expression.callee) &&
      t.isIdentifier(expression.callee.object, { name: 'intl' }) &&
      t.isIdentifier(expression.callee.property, { name: 'formatMessage' })
    ) {
      const args = expression.arguments;
      if (args.length > 0 && t.isObjectExpression(args[0])) {
        const messageDescriptor = args[0] as t.ObjectExpression;
        const idProperty = messageDescriptor.properties.find(
          (prop) =>
            t.isObjectProperty(prop) &&
            t.isIdentifier(prop.key, { name: 'id' }) &&
            t.isStringLiteral(prop.value)
        );

        if (idProperty && t.isObjectProperty(idProperty)) {
          const idValue = (idProperty.value as t.StringLiteral).value;
          const existingComponentTranslations =
            this.baseLanguageStrings[componentName] || {};
          const originalText = existingComponentTranslations[idValue];

          if (originalText) {
            strings.push({
              file: this.filePath,
              componentName,
              string: originalText,
              identifier: idValue,
              alreadyUpdated: true,
            });

            if (currentNode) {
              visitedNodes.add(currentNode);
            }
            visitedNodes.add(expression);
          }
        }
      }
    }

    // Mark the expression as visited to prevent duplicates
    visitedNodes.add(expression);
  }
}
