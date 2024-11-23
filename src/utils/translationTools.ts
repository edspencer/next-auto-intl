import z from 'zod';
import { generateObject } from 'ai';
import fs from 'fs';
import path from 'path';
import { openai } from '@ai-sdk/openai';

import languages from '../data/languages';

import {
  TranslationItem,
  MessagesObject,
  StringInfo,
  Configuration,
} from '../types';

export async function translateStrings(
  strings: TranslationItem[],
  targetLanguage: string
): Promise<MessagesObject> {
  const prompt = generateTranslationPrompt(strings, targetLanguage);

  // console.log(prompt);

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

function createMessageObjectFromTranslations(
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

export function saveTranslations(
  messages: MessagesObject,
  locale: string,
  config: Configuration
) {
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
  const newMessages = { ...existingMessages, ...messages };

  console.log('saving translations to', localeFile);

  //save the new messages
  fs.writeFileSync(localeFile, JSON.stringify(newMessages, null, 2));
}

export function createMessagesObject(strings: StringInfo[]): MessagesObject {
  const messages: {
    [componentName: string]: { [identifier: string]: string };
  } = {};

  strings.forEach((info) => {
    if (!messages[info.componentName]) {
      messages[info.componentName] = {};
    }
    messages[info.componentName][info.identifier] = info.string;
  });

  return messages;
}
