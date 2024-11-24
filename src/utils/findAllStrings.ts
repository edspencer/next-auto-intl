import { getJsxFiles } from '../utils/fileScanner';
import { parseFile } from '../utils/parser';
import { extractStrings } from '../extractStrings';
import { loadBaseTranslations } from '../utils/translationTools';

import { Configuration, StringInfo, MessagesObject } from '../types';

export function findAllStrings(config: Configuration) {
  const files = getJsxFiles(config.scanDirs);
  let allStrings: StringInfo[] = [];

  console.log(`Detected ${files.length} files`);

  console.log(files);

  const baseTranslations = loadBaseTranslations(config);

  for (const file of files) {
    const ast = parseFile(file);
    const strings = extractStrings(ast, file, baseTranslations);
    allStrings = allStrings.concat(strings);
  }

  const { componentWhitelist } = config;

  if (componentWhitelist) {
    console.log('Whitelisting components:', componentWhitelist);
    allStrings = allStrings.filter((info) =>
      componentWhitelist.includes(info.componentName)
    );
  }

  return allStrings;
}
