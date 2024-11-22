import { StringInfo } from "../types";

/**
 * Detects duplicate component names in an array of StringInfo objects.
 *
 * @param strings - An array of StringInfo objects containing component names and file paths.
 * @returns An object where the keys are duplicate component names and the values are arrays of file paths where the duplicates are found.
 */
export function duplicateNameDetector(strings: StringInfo[]) {
  const names: Record<string, string[]> = {};
  const duplicateNames: Record<string, string[]> = {};

  strings.forEach((info) => {
    const { componentName, file } = info;

    if (!names[componentName]) {
      names[componentName] = [];
    }

    if (!names[componentName].includes(file)) {
      names[componentName].push(file);

      if (names[componentName].length > 1) {
        duplicateNames[componentName] = names[componentName];
      }
    }
  });

  return duplicateNames;
}
