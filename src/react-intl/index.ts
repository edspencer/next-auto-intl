import * as t from '@babel/types';

import {
  Configuration,
  MessagesObject,
  StringInfo,
  TargetLibrary,
} from '../types';
import { ReactIntlExtractor } from './extractor';
import { ReactIntlUpdater } from './updater';

export const ReactIntlTargetLibrary: TargetLibrary = {
  extractStrings(
    ast: t.File,
    filePath: string,
    baseLanguageStrings: MessagesObject
  ): StringInfo[] {
    const extractor = new ReactIntlExtractor(
      ast,
      filePath,
      baseLanguageStrings
    );
    return extractor.extractStrings();
  },

  updateSource(sourceCode: string, strings: StringInfo[]): string {
    const updater = new ReactIntlUpdater(sourceCode, strings);
    return updater.updateSource();
  },

  saveTranslations(
    messages: MessagesObject,
    locale: string,
    config: Configuration
  ): Promise<void> {
    // Existing implementation

    return Promise.resolve();
  },
};
