import { sync as globSync } from "glob";
import * as path from "path";

export function getJsxFiles(scanDirs: string[] = ["."]): string[] {
  return scanDirs.map((dir) => scanDirectory(dir)).flat();
}

export function scanDirectory(dir: string): string[] {
  const absoluteDir = path.resolve(dir);

  console.log(`Scanning directory: ${absoluteDir}`);

  return globSync(`${absoluteDir}/**/*.{tsx,jsx}`, {
    ignore: [`${absoluteDir}/node_modules/**`, `${absoluteDir}/**/*.d.ts`],
  });
}
