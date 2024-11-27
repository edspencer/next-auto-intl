import { StringInfo } from '../types';

export abstract class BaseUpdater {
  constructor(
    protected sourceCode: string,
    protected strings: StringInfo[],
    protected locale: string
  ) {}

  /**
   * Updates the source code by replacing strings.
   */
  abstract updateSource(): string;
}
