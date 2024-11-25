import * as fs from 'fs';
import { parse } from '@babel/parser';

/**
 * Parses a file using Babel.
 *
 * @param filePath - The path to the file to parse.
 * @returns The AST of the file.
 */
export function parseFile(filePath: string) {
  const code = fs.readFileSync(filePath, 'utf-8');
  return parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
}
