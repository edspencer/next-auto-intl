const config = {
  scanDirs: ['./src'],
  baseLanguage: 'en',
  targetLanguages: ['pt'],
  messagesDir: './i18n/messages',
  allowDuplicateComponentNames: true,

  rewriteSourceFiles: true,
  lintAfterRewrite: false,
  targetLibrary: 'next-intl',
};

module.exports = config;
