import path from 'path';

import { Configuration, autoI18n } from 'next-auto-intl';

const config: Configuration = {
  scanDirs: ['./app', './components'],
  baseLanguage: 'en',
  targetLanguages: ['pt', 'fr'],
  messagesDir: path.resolve('./i18n/messages'),
  allowDuplicateComponentNames: true,

  componentWhitelist: ['EmptyChat'],

  rewriteSourceFiles: false,
  lintAfterRewrite: true,
};

async function run() {
  await autoI18n(config);
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    console.log('done');
    process.exit(0);
  });
