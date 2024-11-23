import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { updateSource } from './updateSource';
import { translateStrings, saveTranslations } from './translationTools';

import { ComponentStrings, TranslationItem, Configuration } from '../types';

export async function translateComponent(
  component: ComponentStrings,
  config: Configuration
) {
  const { componentName } = component;
  const { baseLanguage, targetLanguages = [] } = config;

  //create the translations
  const translationItems: TranslationItem[] = component.strings.map(
    ({ identifier, string }) => {
      return {
        componentName,
        original: string,
        identifier,
        translation: '',
        baseLanguage,
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
}

export async function rewriteComponent(
  component: ComponentStrings,
  config: Configuration
): Promise<boolean> {
  const { rewriteSourceFiles, lintAfterRewrite } = config;

  const source = fs.readFileSync(component.file, 'utf8');
  const updated = updateSource(source, component);

  if (rewriteSourceFiles) {
    try {
      fs.writeFileSync(component.file, formatWithPrettier(updated));
    } catch (e) {
      console.error('Error writing file');
      console.error(e);
      return false;
    }
  }

  if (lintAfterRewrite) {
    console.log('Linting with eslint --fix:', component.file);
    try {
      execSync(`npx eslint --fix "${component.file}"`);
    } catch (e) {
      console.error('Error running eslint --fix');
      console.error(e);
      return false;
    }
  }

  return true;
}

export async function processComponent(
  component: ComponentStrings,
  config: Configuration
) {
  await translateComponent(component, config);
  await rewriteComponent(component, config);
}

function formatWithPrettier(code: string): string {
  const prettierPath = path.resolve('./node_modules/.bin/prettier');
  return execSync(`${prettierPath} --parser typescript`, {
    input: code,
    encoding: 'utf-8',
  }).trim();
}
