// import path from 'path';

const config = {
  scanDirs: ['./app', './components'],
  baseLanguage: 'en',
  targetLanguages: ['pt', 'fr'],
  // messagesDir: path.resolve('./i18n/messages'),
  allowDuplicateComponentNames: true,

  componentWhitelist: ['EmptyChat'],

  rewriteSourceFiles: false,
  lintAfterRewrite: true,
};

export default config;
