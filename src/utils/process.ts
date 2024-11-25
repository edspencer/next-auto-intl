import pLimit from 'p-limit';
import { ComponentStrings, Configuration } from '../types';

import { duplicateNameDetector } from './duplicateNameDetector';
import { translateComponent, rewriteComponent } from './componentTools';
import { convertToComponentStrings } from './convertToComponentStrings';
import { findAllStrings } from './findAllStrings';
import { createMessagesObject, saveTranslations } from './translationTools';

/**
 * Processes all the steps: extraction, rewriting, and translation.
 *
 * @param config - The configuration object.
 */
export async function doAll(config: Configuration) {
  await doExtract(config);

  await Promise.all([doRewrite(config), doTranslate(config)]);
}

/**
 * Extracts all internationalizable strings and saves the base language messages.
 *
 * @param config - The configuration object.
 * @returns A promise that resolves to an array of ComponentStrings.
 */
export async function doExtract(
  config: Configuration
): Promise<ComponentStrings[]> {
  const allStrings = findAllStrings(config);
  const { baseLanguage } = config;

  console.log(`Found ${allStrings.length} internationalizable strings`);

  const componentStrings = await convertToComponentStrings(allStrings);

  console.log(
    `Found ${componentStrings.length} internationalizable components`
  );

  //save the base language messages
  console.log('Saving base language messages');
  const messages = createMessagesObject(allStrings);

  await saveTranslations(messages, baseLanguage, config);

  console.log(
    `String extraction complete, found ${allStrings.length} strings, wrote to ${baseLanguage}.json`
  );

  return componentStrings;
}

/**
 * Rewrites components based on the extracted strings.
 *
 * @param config - The configuration object.
 */
export async function doRewrite(config: Configuration) {
  const allStrings = findAllStrings(config);
  const componentStrings = await convertToComponentStrings(allStrings);

  const { allowDuplicateComponentNames } = config;

  const duplicates = duplicateNameDetector(allStrings);

  if (allowDuplicateComponentNames !== true) {
    if (Object.keys(duplicates).length) {
      console.warn(
        `Found ${Object.keys(duplicates).length} duplicate identifiers:`,
        duplicates
      );

      console.warn('Stopping process due to duplicate identifiers');

      return;
    }
  }

  console.log('Rewriting components');
  for (const component of componentStrings) {
    await rewriteComponent(component, config);
  }
}

/**
 * Translates components based on the extracted strings.
 *
 * @param config - The configuration object.
 */
export async function doTranslate(config: Configuration) {
  const allStrings = findAllStrings(config);
  const componentStrings = await convertToComponentStrings(allStrings);

  const { parallelTranslations = 5 } = config;

  console.log('Translating components');
  const limit = pLimit(parallelTranslations);

  await Promise.all(
    componentStrings.map((component) =>
      limit(() => translateComponent(component, config))
    )
  );
}
