import * as t from '@babel/types';

import {
  Configuration,
  MessagesObject,
  StringInfo,
  TargetLibrary,
} from '../types';
import { ReactIntlExtractor } from './extractor';
import { ReactIntlUpdater } from './updater';

import deepmerge from 'deepmerge';
import fs from 'fs';
import path from 'path';

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

  async saveTranslations(
    messages: MessagesObject,
    locale: string,
    config: Configuration
  ): Promise<void> {
    const { messagesDir } = config;
    // Ensure the messages directory exists
    fs.mkdirSync(messagesDir, { recursive: true });

    //load the existing messages
    let existingMessages = {};

    const localeFile = path.join(config.messagesDir!, `${locale}.json`);
    console.log('loading existing translations from', localeFile);
    try {
      existingMessages = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
    } catch (e) {
      console.log(`No existing messages found for locale ${locale}`);
    }

    //merge the new messages with the existing ones
    const newMessages = deepmerge(existingMessages, messages);

    console.log('saving translations to', localeFile);

    //save the new messages
    fs.writeFileSync(localeFile, JSON.stringify(newMessages, null, 2));
  },
};
