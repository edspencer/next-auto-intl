import pLimit from 'p-limit';
import { Configuration } from '../types';

import { duplicateNameDetector } from './duplicateNameDetector';
import { translateComponent, rewriteComponent } from './componentTools';
import { convertToComponentStrings } from './convertToComponentStrings';
import { findAllStrings } from './findAllStrings';
import { createMessagesObject, saveTranslations } from './translationTools';

export async function autoI18n(config: Configuration) {
  const allStrings = findAllStrings(config);
  const {
    allowDuplicateComponentNames,
    parallelTranslations = 5,
    baseLanguage,
  } = config;

  console.log(`Found ${allStrings.length} internationalizable strings`);

  const duplicates = duplicateNameDetector(allStrings);

  if (allowDuplicateComponentNames !== true) {
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

  //save the base language messages
  console.log('Saving base language messages');
  const messages = createMessagesObject(allStrings);
  await saveTranslations(messages, baseLanguage, config);

  console.log(messages);

  console.log('Rewriting components');
  for (const component of componentStrings) {
    await rewriteComponent(component, config);
  }

  console.log('Translating components');
  const limit = pLimit(parallelTranslations);

  await Promise.all(
    componentStrings.map((component) =>
      limit(() => translateComponent(component, config))
    )
  );
}
