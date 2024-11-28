import { NextIntlLibrary } from '../next-intl';
import { Configuration, ConfigurationOptions, TargetLibrary } from '../types';
import { lintCommand } from './componentTools';

export function createConfiguration(
  options: ConfigurationOptions
): Configuration {
  // Destructure targetLibrary from options
  const { targetLibrary, ...restOptions } = options;

  let resolvedTargetLibrary: TargetLibrary;

  // Check if targetLibrary is a string and replace it with the actual implementation
  if (typeof targetLibrary === 'string') {
    switch (targetLibrary) {
      case 'next-intl':
        resolvedTargetLibrary = NextIntlLibrary;
        break;
      default:
        throw new Error(`Unsupported target library: ${targetLibrary}`);
    }
  } else if (targetLibrary) {
    // If it's already a TargetLibrary instance, use it directly
    resolvedTargetLibrary = targetLibrary;
  } else {
    throw new Error('targetLibrary must be specified');
  }

  // Return the full Configuration object
  return {
    ...restOptions,
    targetLibrary: resolvedTargetLibrary,
    // Provide default values for any missing required properties
    scanDirs: options.scanDirs || ['./src'],
    scanFileTypes: options.scanFileTypes || ['js', 'jsx', 'ts', 'tsx'],
    baseLanguage: options.baseLanguage || 'en',
    messagesDir: options.messagesDir || './i18n/messages',
    rewriteSourceFiles: options.rewriteSourceFiles || false,
    lintAfterRewrite: options.lintAfterRewrite || false,
    parallelTranslations: options.parallelTranslations || 5,
    parallelRewrites: options.parallelRewrites || 5,
    lintCommand:
      options.lintCommand ||
      ((filename: string) => `eslint --fix "${filename}"`),
  };
}
