import fs from 'fs';
import path from 'path';
import { saveTranslations } from '../src/utils/translationTools';

jest.mock('fs');
const mockedFs = jest.mocked(fs);

describe('saveTranslations', () => {
  const locale = 'en';
  const config = {
    messagesDir: './messages',
    scanDirs: ['./app', './components'],
    baseLanguage: 'en',
    targetLanguages: ['pt'],
    lintAfterRewrite: false,
  };

  const localeFile = path.join(config.messagesDir, `${locale}.json`);

  beforeEach(() => {
    mockedFs.readFileSync.mockReset();
    mockedFs.writeFileSync.mockReset();
  });

  it('creates a new translations file if none exists', () => {
    mockedFs.readFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });

    const messages = {
      Component1: { key1: 'value1' },
    };

    saveTranslations(messages, locale, config);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      localeFile,
      JSON.stringify(messages, null, 2)
    );
  });

  it('merges new translations with existing ones', () => {
    const existingMessages = {
      Component1: { key1: 'oldValue1' },
      Component2: { key2: 'value2' },
    };

    mockedFs.readFileSync.mockReturnValue(JSON.stringify(existingMessages));

    const newMessages = {
      Component1: { key1: 'newValue1', key3: 'value3' },
      Component3: { key4: 'value4' },
    };

    saveTranslations(newMessages, locale, config);

    const expectedMessages = {
      Component1: { key1: 'newValue1', key3: 'value3' },
      Component2: { key2: 'value2' },
      Component3: { key4: 'value4' },
    };

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      localeFile,
      JSON.stringify(expectedMessages, null, 2)
    );
  });

  it('handles empty existing messages gracefully', () => {
    mockedFs.readFileSync.mockReturnValue('{}');

    const newMessages = {
      Component1: { key1: 'value1' },
    };

    saveTranslations(newMessages, locale, config);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      localeFile,
      JSON.stringify(newMessages, null, 2)
    );
  });
});
