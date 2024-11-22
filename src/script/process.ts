import path from 'path';

import { Configuration } from '../types';

import { duplicateNameDetector } from '../utils/duplicateNameDetector';
import { processComponent } from '../utils/processComponent';
import { convertToComponentStrings } from '../utils/convertToComponentStrings';
import { findAllStrings } from '../utils/findAllStrings';
import {
  createMessagesObject,
  saveTranslations,
} from '../utils/saveTranslations';

const config: Configuration = {
  scanDirs: ['../helpmefind/app', '../helpmefind/components'],
  baseLanguage: 'en',
  targetLanguages: ['pt', 'fr'],
  messagesDir: path.resolve('../helpmefind/i18n/messages'),
  allowDuplicateComponentNames: true,

  rewriteSourceFiles: true,

  // componentWhitelist: ['Pricing', 'Items', 'EmptyChat'],
  componentWhitelist: ['EmptyChat'],

  lintAfterRewrite: true,
};

async function main(config: Configuration) {
  const allStrings = findAllStrings(config);

  console.log(`Found ${allStrings.length} internationalizable strings`);

  const duplicates = duplicateNameDetector(allStrings);

  if (config.allowDuplicateComponentNames !== true) {
    if (Object.keys(duplicates).length) {
      console.warn(
        `Found ${Object.keys(duplicates).length} duplicate identifiers:`,
        duplicates
      );

      return;
    }
  }

  const componentStrings = await convertToComponentStrings(allStrings);

  console.log(
    `Found ${componentStrings.length} internationalizable components`
  );

  const messages = createMessagesObject(allStrings);
  await saveTranslations(messages, config.baseLanguage, config);

  console.log(messages);

  for (const component of componentStrings) {
    await processComponent(component, config);
  }
}

main(config).catch((error) => console.error(error));
