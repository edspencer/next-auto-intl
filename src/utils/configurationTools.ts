import { Configuration } from '../types';

export function createConfiguration(
  config: Partial<Configuration>
): Configuration {
  return {
    scanDirs: ['./app', './components'],
    scanFileTypes: ['js', 'jsx', 'ts', 'tsx'],
    baseLanguage: 'en',
    targetLanguages: ['pt'],
    messagesDir: './i18n/messages',
    allowDuplicateComponentNames: true,
    rewriteSourceFiles: true,
    lintAfterRewrite: true,
    parallelRewrites: 5,
    parallelTranslations: 5,
    ...config,
  };
}
