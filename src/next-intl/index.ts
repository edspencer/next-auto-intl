import { TargetLibrary, StringInfo, MessagesObject } from '../types';
import { NextIntlExtractor } from './extractor';
import { NextIntlUpdater } from './updater';
import * as t from '@babel/types';

export const NextIntlLibrary: TargetLibrary = {
  extractStrings(
    ast: t.File,
    filePath: string,
    baseLanguageStrings: MessagesObject
  ): StringInfo[] {
    const extractor = new NextIntlExtractor(ast, filePath, baseLanguageStrings);
    return extractor.extractStrings();
  },

  updateSource(sourceCode: string, strings: StringInfo[]): string {
    const updater = new NextIntlUpdater(sourceCode, strings);
    return updater.updateSource();
  },
};
