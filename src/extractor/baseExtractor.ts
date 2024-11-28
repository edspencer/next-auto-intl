// extractor/baseExtractor.ts

import * as babelTraverse from '@babel/traverse';
import * as t from '@babel/types';
import { StringInfo, MessagesObject } from '../types';
import slugify from 'slugify';

let traverse = babelTraverse.default || babelTraverse;
traverse = (traverse as any).default || traverse;

export abstract class BaseExtractor {
  protected componentScopes: Map<
    string,
    | t.FunctionDeclaration
    | t.FunctionExpression
    | t.ArrowFunctionExpression
    | t.ClassDeclaration
    | t.Function
  > = new Map();

  protected visitedNodes: Set<t.Node> = new Set();

  constructor(
    protected ast: t.File,
    protected filePath: string,
    protected baseLanguageStrings: MessagesObject
  ) {}

  /**
   * Collects all React component scopes in the file.
   */
  protected collectComponentScopes() {
    traverse(this.ast, {
      FunctionDeclaration: (path) => {
        const node = path.node;

        if (node.id && /^[A-Z]/.test(node.id.name)) {
          if (this.containsJSX(node.body)) {
            this.componentScopes.set(node.id.name, node);
          }
        }
      },
      FunctionExpression: (path) => {
        const parent = path.parent;
        if (
          t.isVariableDeclarator(parent) &&
          t.isIdentifier(parent.id) &&
          /^[A-Z]/.test(parent.id.name)
        ) {
          if (this.containsJSX(path.node.body)) {
            this.componentScopes.set(parent.id.name, path.node);
          }
        }
      },
      ArrowFunctionExpression: (path) => {
        const parent = path.parent;
        if (
          t.isVariableDeclarator(parent) &&
          t.isIdentifier(parent.id) &&
          /^[A-Z]/.test(parent.id.name)
        ) {
          if (this.containsJSX(path.node.body)) {
            this.componentScopes.set(parent.id.name, path.node);
          }
        }
      },
      ClassDeclaration: (path) => {
        const node = path.node;

        if (node.id && /^[A-Z]/.test(node.id.name)) {
          if (this.containsJSXClassComponent(node)) {
            this.componentScopes.set(node.id.name, node);
          }
        }
      },
      // Handle React.forwardRef components
      CallExpression: (path) => {
        const { callee, arguments: args } = path.node;

        if (
          t.isMemberExpression(callee) &&
          t.isIdentifier(callee.object, { name: 'React' }) &&
          t.isIdentifier(callee.property, { name: 'forwardRef' }) &&
          args.length > 0 &&
          (t.isFunctionExpression(args[0]) ||
            t.isArrowFunctionExpression(args[0]))
        ) {
          const functionExpression = args[0] as
            | t.FunctionExpression
            | t.ArrowFunctionExpression;

          // Ensure the parent is a VariableDeclarator to access id
          const parent = path.parent;
          if (
            t.isVariableDeclarator(parent) &&
            t.isIdentifier(parent.id) &&
            /^[A-Z]/.test(parent.id.name)
          ) {
            if (this.containsJSX(functionExpression.body)) {
              this.componentScopes.set(parent.id.name, functionExpression);
            }
          }
        }
      },
    });
  }

  /**
   * Checks if the given function body contains JSX elements.
   */
  protected containsJSX(body: t.BlockStatement | t.Expression | null): boolean {
    if (!body) return false;

    let foundJSX = false;

    function checkNode(node: t.Node) {
      if (t.isJSXElement(node) || t.isJSXFragment(node)) {
        foundJSX = true;
      }
    }

    if (t.isBlockStatement(body)) {
      body.body.forEach((statement) => {
        t.traverseFast(statement, checkNode);
      });
    } else {
      t.traverseFast(body, checkNode);
    }

    return foundJSX;
  }

  /**
   * Checks if a class component contains JSX in its render method.
   */
  protected containsJSXClassComponent(node: t.ClassDeclaration): boolean {
    let foundJSX = false;

    // Iterate over class body elements
    for (const classElement of node.body.body) {
      if (t.isClassMethod(classElement)) {
        const methodKey = classElement.key;
        let methodName: string | null = null;

        if (t.isIdentifier(methodKey)) {
          methodName = methodKey.name;
        } else if (t.isStringLiteral(methodKey)) {
          methodName = methodKey.value;
        } else if (t.isPrivateName(methodKey)) {
          const privateName = methodKey as t.PrivateName;
          methodName = privateName.id.name;
        }

        if (methodName === 'render') {
          if (this.containsJSX(classElement.body)) {
            foundJSX = true;
            break; // No need to continue
          }
        }
      }
    }

    return foundJSX;
  }

  /**
   * Determines the nearest React component name for a given path.
   */
  protected getNearestComponentName(path: any): string {
    let currentPath = path;

    while (currentPath) {
      const parentNode = currentPath.parentPath?.node;

      if (t.isFunctionDeclaration(parentNode) && parentNode.id?.name) {
        if (this.componentScopes.has(parentNode.id.name)) {
          return parentNode.id.name;
        }
      } else if (
        t.isVariableDeclarator(parentNode) &&
        t.isIdentifier(parentNode.id)
      ) {
        if (this.componentScopes.has(parentNode.id.name)) {
          return parentNode.id.name;
        }
      } else if (t.isClassDeclaration(parentNode) && parentNode.id?.name) {
        if (this.componentScopes.has(parentNode.id.name)) {
          return parentNode.id.name;
        }
      }

      currentPath = currentPath.parentPath;
    }

    return 'UnknownComponent';
  }

  /**
   * Checks if a JSX attribute is user-facing (e.g., alt, title).
   */
  protected isUserFacingAttribute(attrName: string): boolean {
    const userFacingAttributes = ['alt', 'title', 'placeholder', 'aria-label'];
    return userFacingAttributes.includes(attrName);
  }

  /**
   * Creates a StringInfo object containing information about the extracted string.
   */
  protected createStringInfo(
    componentName: string,
    text: string,
    options: any = {}
  ): StringInfo {
    const identifier = this.generateIdentifier(text);

    return {
      file: this.filePath,
      componentName,
      string: text,
      identifier,
      ...options,
    };
  }

  /**
   * Generates a unique identifier for a given text string.
   */
  protected generateIdentifier(text: string): string {
    return slugify(text, { lower: true, strict: true })
      .split('-')
      .slice(0, 5)
      .join('-');

    // return text
    //   .trim()
    //   .toLowerCase()
    //   .replace(/[^a-z0-9]+/g, '-')
    //   .replace(/^-+|-+$/g, '')
    //   .substring(0, 50);
  }

  /**
   * Abstract method to extract strings, to be implemented by subclasses.
   */
  abstract extractStrings(): StringInfo[];
}
