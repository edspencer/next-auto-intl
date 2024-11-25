const config = {
  scanDirs: ['./app', './components'],
  baseLanguage: 'en',
  targetLanguages: ['pt'],
  messagesDir: './i18n/messages',
  allowDuplicateComponentNames: true,

  rewriteSourceFiles: true,
  lintAfterRewrite: true,
};

export default config;
