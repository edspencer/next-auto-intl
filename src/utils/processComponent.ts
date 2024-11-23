import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { updateSource } from './updateSource';
import { translateStrings } from './translateStrings';
import { saveTranslations } from './saveTranslations';

import { ComponentStrings, TranslationItem, Configuration } from '../types';

export async function processComponent(
  component: ComponentStrings,
  config: Configuration
) {
  const { componentName } = component;
  const { baseLanguage, targetLanguages = [], rewriteSourceFiles, lintAfterRewrite } = config;

  //create the translations
  const translationItems: TranslationItem[] = component.strings.map(
    ({ identifier, string }) => {
      return {
        componentName,
        original: string,
        identifier,
        translation: '',
        originalLanguage: baseLanguage,
      };
    }
  );

  console.log('Translation items for', componentName);
  console.log(translationItems);

  for (const targetLanguage of targetLanguages) {
    console.log(
      `Translating ${translationItems.length} strings to ${targetLanguage}`
    );
    const translated = await translateStrings(translationItems, targetLanguage);

    console.log(translated);

    saveTranslations(translated, targetLanguage, config);
  }

  const source = fs.readFileSync(component.file, 'utf8');
  const updated = updateSource(source, component);

  if (rewriteSourceFiles) {
    fs.writeFileSync(component.file, formatWithPrettier(updated));
  }

  if (lintAfterRewrite) {
    console.log('Linting with eslint --fix:', component.file);
    execSync(`npx eslint --fix ${component.file}`);
  }

  // console.log(formatWithPrettier(updated));
}

function formatWithPrettier(code: string): string {
  const prettierPath = path.resolve('./node_modules/.bin/prettier');
  return execSync(`${prettierPath} --parser typescript`, {
    input: code,
    encoding: 'utf-8',
  }).trim();
}
