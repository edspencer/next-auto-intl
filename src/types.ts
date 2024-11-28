import * as t from '@babel/types';

/**
 * Configuration object for the automatic internationalization tool.
 */
export type Configuration = {
  /**
   * Directories to scan for React components containing strings to translate.
   * Paths are relative to the root of the project.
   */
  scanDirs: string[];

  /**
   * List of file types to scan for React components.
   * Defaults to ['js', 'jsx', 'ts', 'tsx'] if not specified.
   */
  scanFileTypes: string[];

  /**
   * If present, overrides the scanDirs option and specifies individual files to scan.
   * Allows you to target specific files for translation.
   */
  scanFiles?: string[];

  /**
   * The base language for the application (e.g., 'en').
   * This language serves as the source for all translations.
   */
  baseLanguage: string;

  /**
   * List of target languages to translate the base language strings into.
   * If not provided, no translations will be generated.
   */
  targetLanguages?: string[];

  /**
   * Directory where translation files (e.g., JSON) will be stored.
   * Defaults to `./i18n/messages` if not specified.
   */
  messagesDir: string;

  /**
   * Allow multiple components to have the same name in the codebase.
   * Defaults to `false`. If `true`, components with the same name
   * will be treated as separate for translation purposes.
   */
  allowDuplicateComponentNames?: boolean;

  /**
   * Whether to rewrite source files to replace strings with translation functions.
   * If `true`, source files will be modified to use the `t()` function.
   * Defaults to `false`.
   */
  rewriteSourceFiles: boolean;

  /**
   * Whether to delete translations that are no longer used in the codebase.
   * If `true`, unused keys will be removed from the translation files.
   * Defaults to `false`.
   */
  deleteUnusedTranslations?: boolean;

  /**
   * Optional list of component names to include in the translation process.
   * If not provided, all components will be included.
   */
  componentWhitelist?: string[];

  /**
   * Whether to run ESLint's `--fix` option on source files after rewriting them.
   * Helps ensure that rewritten files conform to the project's coding standards.
   */
  lintAfterRewrite: boolean;

  /**
   * Optional number of parallel translations to run using the configured LLM service.
   * Defaults to 5 if not specified.
   */
  parallelTranslations: number;

  /**
   * Optional number of parallel file rewrites to run
   * Defaults to 5 if not specified.
   */
  parallelRewrites: number;

  /**
   * Optional command to run ESLint with the `--fix` option.
   */
  lintCommand: (filename: string) => string;

  targetLibrary: TargetLibrary;
};

export type RewriteConfiguration = {
  /**
   * Whether to rewrite source files to replace strings with translation functions.
   */
  rewriteSourceFiles: boolean;

  /**
   * Whether to run ESLint's `--fix` option on source files after rewriting them.
   * Helps ensure that rewritten files conform to the project's coding standards.
   */
  lintAfterRewrite: boolean;

  /**
   * Callback that returns the CLI command to run to lint the file
   * (defaults to 'eslint --fix "<filename>">')
   */
  lintCommand: (filename: string) => string;

  /**
   * Optional number of parallel file rewrites to run
   * Defaults to 5 if not specified.
   */
  parallelRewrites: number;
};

//the set of allowed target libraries by string name
export type AllowedTargetLibraries = 'next-intl';

export type ConfigurationOptions = Partial<
  Omit<Configuration, 'targetLibrary'>
> & {
  /**
   * The target internationalization library to use.
   * Can be a string from the allowed list or a custom TargetLibrary implementation.
   */
  targetLibrary?: AllowedTargetLibraries | TargetLibrary;
};

export interface TargetLibrary {
  /**
   * Extracts strings from the AST and returns an array of StringInfo.
   */
  extractStrings(
    ast: t.File,
    filePath: string,
    baseLanguageStrings: MessagesObject
  ): StringInfo[];

  /**
   * Updates the source code by replacing strings with the appropriate translation functions.
   */
  updateSource(sourceCode: string, strings: StringInfo[]): string;

  saveTranslations(
    messages: MessagesObject,
    locale: string,
    config: Configuration
  ): void;
}

/**
 * Represents a single translation item.
 * Used to store and process information about a specific string in a component.
 */
export type TranslationItem = {
  /**
   * Name of the React component that contains the string.
   */
  componentName: string;

  /**
   * The original string in the base language.
   */
  original: string;

  /**
   * A unique identifier for the string, typically a slugified version of the original text.
   */
  identifier: string;

  /**
   * The translated string in the target language.
   */
  translation: string;

  /**
   * Optional base language for the string (e.g., 'en').
   */
  baseLanguage?: string;

  /**
   * Optional target language for the translation (e.g., 'fr').
   */
  targetLanguage?: string;
};

/**
 * Represents detailed information about a single translatable string.
 */
export interface StringInfo {
  /**
   * Path to the file where the string is located.
   */
  file: string;

  /**
   * Name of the React component that contains the string.
   */
  componentName: string;

  /**
   * The translatable string.
   */
  string: string;

  /**
   * A unique identifier for the string, typically used in translation files.
   */
  identifier: string;

  /**
   * If true, signifies that the string was something like {t('welcome-to-myapp')}
   * and therefore has already been updated to use the t() function. This is used to
   * decide if we need to rewrite the source file.
   */
  alreadyUpdated?: boolean;

  /**
   * Indicates whether this string was found inside JSX text or within a JSX expression.
   * If true, it was in a JSX expression like {`  some string  `}.
   */
  isExpression?: boolean;

  /**
   * Contains contextual information about leading/trailing spaces.
   * This is useful for preserving spaces between mixed inline elements.
   */
  surroundingSpaces?: {
    leading: boolean; // Whether there's a leading space before this string
    trailing: boolean; // Whether there's a trailing space after this string
  };
}

/**
 * Represents all translatable strings for a single React component.
 */
export interface ComponentStrings {
  /**
   * Path to the file where the component is located.
   */
  file: string;

  /**
   * Name of the React component.
   */
  componentName: string;

  /**
   * Array of `StringInfo` objects representing all strings in the component.
   */
  strings: StringInfo[];
}

/**
 * Represents all translatable strings in a file, grouped by components.
 */
export interface ComponentFileStrings {
  /**
   * Path to the file containing the components.
   */
  file: string;

  /**
   * Array of `ComponentStrings` objects, each representing a component in the file.
   */
  components: ComponentStrings[];
}

/**
 * Represents a map of string identifiers to their corresponding text for a single component.
 * Used in translation files.
 */
export interface ComponentStringsMap {
  [identifier: string]: string;
}

/**
 * Represents a collection of all strings for all components in a project.
 * Each key is the name of a component, and the value is a `ComponentStringsMap`.
 */
export interface MessagesObject {
  [componentName: string]: ComponentStringsMap;
}
