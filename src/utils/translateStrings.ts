import languages from '../data/languages';
import z from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

import { TranslationItem, MessagesObject } from '../types';

export async function translateStrings(
  strings: TranslationItem[],
  targetLanguage: string
): Promise<MessagesObject> {
  const prompt = generateTranslationPrompt(strings, targetLanguage);

  console.log(prompt);

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    output: 'array',
    schema: z.object({
      identifier: z.string().describe('The identifier of the string'),
      original: z.string().describe('The original string'),
      translation: z.string().describe('The translation of the string'),
      componentName: z
        .string()
        .describe('The name of the React component where the string is used'),
    }),
    temperature: 0,
    prompt,
  });

  return createMessageObjectFromTranslations(object);
}

export function createMessageObjectFromTranslations(
  translations: TranslationItem[]
): MessagesObject {
  const messages: {
    [componentName: string]: { [identifier: string]: string };
  } = {};

  translations.forEach((translation) => {
    if (!messages[translation.componentName]) {
      messages[translation.componentName] = {};
    }
    messages[translation.componentName][translation.identifier] =
      translation.translation;
  });

  return messages;
}

function generateTranslationPrompt(
  strings: TranslationItem[],
  targetLanguage: string
) {
  const languageName = languages.find(
    (lang) => lang.code === targetLanguage
  )?.name;

  const examples = strings
    .map(
      (string) =>
        ` Identifier: "${string.identifier}"\n Original: "${string.original}"\n Component Name: "${string.componentName}"\n Translation:`
    )
    .join('\n\n');

  return `Your task is to translate strings found inside React components from English into ${
    languageName || targetLanguage
  }.
  For each translation you will be given the original text, a unique identifier for the string, and the componentName of the
  React component that has the string rendered inside of it. Please return a JSON array of objects, 
  with each object containing "identifier", "original" and "translation" fields:\n\n${examples}`;
}
