export type Configuration = {
  scanDirs: string[];
  baseLanguage: string;
  targetLanguages?: string[];
  messagesDir?: string;
  allowDuplicateComponentNames?: boolean;
  rewriteSourceFiles?: boolean;

  deleteUnusedTranslations?: boolean;

  /**
   * Optional list of component names to include in the translation process.
   * If not provided, all components will be included.
   */
  componentWhitelist?: string[];

  /**
   * Run eslint --fix on the source files after updating them with translations.
   */
  lintAfterRewrite: boolean;

  /**
   * Optional number of parallel translations to run using whichever LLM service
   * is configured.
   * Default is 5.
   */
  parallelTranslations?: number;
};

export type TranslationItem = {
  componentName: string;
  original: string;
  identifier: string;
  translation: string;
  baseLanguage?: string;
  targetLanguage?: string;
};

export interface StringInfo {
  file: string;
  componentName: string;
  string: string;
  identifier: string;
}

export interface ComponentStrings {
  file: string;
  componentName: string;
  strings: StringInfo[];
}

export interface ComponentFileStrings {
  file: string;
  components: ComponentStrings[];
}

export interface MessagesObject {
  [componentName: string]: {
    [identifier: string]: string;
  };
}
