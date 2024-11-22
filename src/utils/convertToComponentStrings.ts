import { StringInfo, ComponentStrings } from '../types';

/**
 * Converts an array of `StringInfo` objects into an array of `ComponentStrings` objects.
 * Groups strings by their component name.
 *
 * @param allStrings - An array of `StringInfo` objects to be converted.
 * @returns An array of `ComponentStrings` objects, each containing strings grouped by component name.
 */
export function convertToComponentStrings(
  allStrings: StringInfo[]
): ComponentStrings[] {
  const componentStrings: ComponentStrings[] = [];

  allStrings.forEach((stringInfo) => {
    const existingComponent = componentStrings.find(
      (c) => c.componentName === stringInfo.componentName
    );

    if (existingComponent) {
      existingComponent.strings.push(stringInfo);
    } else {
      componentStrings.push({
        file: stringInfo.file,
        componentName: stringInfo.componentName,
        strings: [stringInfo],
      });
    }
  });

  return componentStrings;
}
