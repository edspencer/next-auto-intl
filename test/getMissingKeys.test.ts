import { getMissingKeys } from '../src/utils/translationTools';
import { MessagesObject } from '../src/types';

describe('getMissingKeys', () => {
  it('returns an empty object when target has all keys', () => {
    const baseLanguage: MessagesObject = {
      ComponentA: {
        key1: 'value1',
        key2: 'value2',
      },
    };

    const targetLanguage: MessagesObject = {
      ComponentA: {
        key1: 'value1',
        key2: 'value2',
      },
    };

    const result = getMissingKeys(baseLanguage, targetLanguage);
    expect(result).toEqual({});
  });

  it('returns missing keys for a single component', () => {
    const baseLanguage: MessagesObject = {
      ComponentA: {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      },
    };

    const targetLanguage: MessagesObject = {
      ComponentA: {
        key1: 'value1',
      },
    };

    const result = getMissingKeys(baseLanguage, targetLanguage);
    expect(result).toEqual({
      ComponentA: {
        key2: 'value2',
        key3: 'value3',
      },
    });
  });

  it('returns missing keys for multiple components', () => {
    const baseLanguage: MessagesObject = {
      ComponentA: {
        key1: 'value1',
        key2: 'value2',
      },
      ComponentB: {
        key3: 'value3',
        key4: 'value4',
      },
    };

    const targetLanguage: MessagesObject = {
      ComponentA: {
        key1: 'value1',
      },
      ComponentB: {
        key3: 'value3',
      },
    };

    const result = getMissingKeys(baseLanguage, targetLanguage);
    expect(result).toEqual({
      ComponentA: {
        key2: 'value2',
      },
      ComponentB: {
        key4: 'value4',
      },
    });
  });

  it('handles cases where target has no translations for a component', () => {
    const baseLanguage: MessagesObject = {
      ComponentA: {
        key1: 'value1',
        key2: 'value2',
      },
      ComponentB: {
        key3: 'value3',
      },
    };

    const targetLanguage: MessagesObject = {
      ComponentA: {
        key1: 'value1',
      },
    };

    const result = getMissingKeys(baseLanguage, targetLanguage);
    expect(result).toEqual({
      ComponentA: {
        key2: 'value2',
      },
      ComponentB: {
        key3: 'value3',
      },
    });
  });

  it('returns the entire base language if the target is empty', () => {
    const baseLanguage: MessagesObject = {
      ComponentA: {
        key1: 'value1',
        key2: 'value2',
      },
    };

    const targetLanguage: MessagesObject = {};

    const result = getMissingKeys(baseLanguage, targetLanguage);
    expect(result).toEqual(baseLanguage);
  });

  it('returns an empty object when both base and target are empty', () => {
    const baseLanguage: MessagesObject = {};
    const targetLanguage: MessagesObject = {};

    const result = getMissingKeys(baseLanguage, targetLanguage);
    expect(result).toEqual({});
  });
});
