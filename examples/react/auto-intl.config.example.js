// import path from 'path';

const config = {
  scanDirs: ['./src'],
  baseLanguage: 'en',
  targetLanguages: ['pt'],
  messagesDir: './i18n/messages',
  allowDuplicateComponentNames: true,

  rewriteSourceFiles: true,
  lintAfterRewrite: false,
  targetLibrary: 'react-intl',
};

export default config;
