import { sync as globSync } from 'glob';
import * as path from 'path';

/**
 * Returns an array of all JSX files in the specified directories.
 *
 * @param scanDirs - The directories to scan for JSX files.
 * @returns An array of file paths.
 */
export function getJsxFiles(
  scanDirs: string[] = ['.'],
  scanFileTypes: string[]
): string[] {
  return scanDirs.map((dir) => scanDirectory(dir, scanFileTypes)).flat();
}

/**
 * Scans a directory for JSX files.
 *
 * @param dir - The directory to scan.
 * @returns An array of file paths.
 */
export function scanDirectory(dir: string, scanFileTypes: string[]): string[] {
  const absoluteDir = path.resolve(dir);

  console.log(`Scanning directory: ${absoluteDir}`);

  return globSync(`${absoluteDir}/**/*.{${scanFileTypes.join(',')}}`, {
    ignore: [`${absoluteDir}/node_modules/**`, `${absoluteDir}/**/*.d.ts`],
  });
}
