import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

import { updateSource } from '../src/utils/updateSource';
import { ComponentStrings } from '../src/types';

const componentStrings: ComponentStrings = {
  componentName: 'RegisterPage',
  file: '',
  strings: [
    {
      file: path.resolve(__dirname, 'fixtures', 'RegisterPage.tsx'),
      componentName: 'RegisterPage',
      string: 'Sign Up',
      identifier: 'sign-up',
    },
    {
      file: path.resolve(__dirname, 'fixtures', 'RegisterPage.tsx'),
      componentName: 'RegisterPage',
      string: 'Create an account with your email and password',
      identifier: 'create-an-account-with-your',
    },
    {
      file: path.resolve(__dirname, 'fixtures', 'RegisterPage.tsx'),
      componentName: 'RegisterPage',
      string: 'Sign Up',
      identifier: 'sign-up',
    },
    {
      file: path.resolve(__dirname, 'fixtures', 'RegisterPage.tsx'),
      componentName: 'RegisterPage',
      string: 'Sign in',
      identifier: 'sign-in',
    },
  ],
};

describe('updateSourceFile', () => {
  it('should transform the Register Page properly', () => {
    const expectedOutputFile = path.resolve(
      __dirname,
      'fixtures',
      'RegisterPage.Transformed.tsx'
    );

    const expectedOutput = formattedSourceFile(expectedOutputFile);

    const transformedCode = transformRegisterPage();

    // Compare the formatted outputs
    expect(transformedCode).toBe(expectedOutput);
  });

  it('should be idempotent', () => {
    const expectedOutputFile = path.resolve(
      __dirname,
      'fixtures',
      'RegisterPage.Transformed.tsx'
    );

    const expectedOutput = formattedSourceFile(expectedOutputFile);

    const transformedCode = transformRegisterPage();

    //transform it again, should not change
    const transformedCode2 = formatWithPrettier(
      updateSource(transformedCode, componentStrings)
    );

    // Compare the formatted outputs
    expect(transformedCode2).toBe(expectedOutput);
  });
});

function transformRegisterPage() {
  const inputFile = path.resolve(__dirname, 'fixtures', 'RegisterPage.tsx');

  const inputCode = fs.readFileSync(inputFile, 'utf-8');

  // Run the transformation
  const transformedCode = updateSource(inputCode, componentStrings);

  return formatWithPrettier(transformedCode);
}

function formattedSourceFile(filePath: string): string {
  return formatWithPrettier(fs.readFileSync(filePath, 'utf-8'));
}

// Helper to format code with Prettier via CLI
function formatWithPrettier(code: string): string {
  const prettierPath = path.resolve('./node_modules/.bin/prettier');
  return execSync(`${prettierPath} --parser typescript`, {
    input: code,
    encoding: 'utf-8',
  }).trim();
}
