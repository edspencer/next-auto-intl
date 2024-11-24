import fs from 'fs';
import path from 'path';

import { MessagesObject, StringInfo, Configuration } from '../types';

export function saveTranslations(
  messages: MessagesObject,
  locale: string,
  config: Configuration
) {
  //load the existing messages
  let existingMessages = {};

  const localeFile = path.join(config.messagesDir!, `${locale}.json`);
  console.log('loading: ', localeFile);
  try {
    existingMessages = require(localeFile);
  } catch (e) {
    console.log(`No existing messages found for locale ${locale}`);
  }

  //merge the new messages with the existing ones
  const newMessages = { ...existingMessages, ...messages };

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
