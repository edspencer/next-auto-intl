#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path, { dirname } from 'path';

import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

import { doExtract, doTranslate, doRewrite, doAll } from '../src/utils/process';
import { createConfiguration } from '../src/utils/configurationTools';

program
  .name('react-auto-intl')
  .description('AI-driven automatic internationalization for your Next.js app')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate a default config file')
  .action(async () => {
    const questions = [
      {
        type: 'input',
        name: 'ts',
        message: 'TypeScript?',
        default: 'y',
      },
    ];

    console.log(
      '\nThis will create a TypeScript or JavaScript file with the default configuration\n'
    );

    // const answers = await inquirer.prompt(questions);
    const appConfigFilePath = path.resolve(
      process.cwd(),
      'i18n/auto-intl.config.mjs'
    );

    fs.writeFileSync(
      appConfigFilePath,
      fs.readFileSync(path.resolve(__dirname, './auto-intl.config.mjs'))
    );
    console.log(`Config file created at ${appConfigFilePath}`);
  });

program
  .command('scan')
  .description(
    'Discovers all strings from the codebase and logs them to the console'
  )
  .action(async () => {
    const config = await getConfig();

    const componentStrings = await doExtract(config, false);

    for (const { componentName, strings } of componentStrings) {
      console.log(`${componentName}: ${strings.length} strings`);

      for (const { string, identifier } of strings) {
        console.log(`  ${identifier}: ${string}`);
      }

      console.log('\n');
    }
  });

program
  .command('extract')
  .description(
    'Extracts all strings from the codebase and saves them to {baseLanguage}.json'
  )
  .action(async () => {
    const config = await getConfig();

    await doExtract(config);
  });

program
  .command('translate')
  .description(
    'Translates any strings in {baseLanguage}.json to all listed target languages'
  )
  .action(async () => {
    const config = await getConfig();

    console.log('Translating strings with config:', config);
    await doTranslate(config);
  });

program
  .command('rewrite')
  .description(
    'Rewrites all strings in the codebase to use the internationalization function'
  )
  .action(async () => {
    const config = await getConfig();

    console.log('Translating strings with config:', config);
    await doRewrite(config);
  });

program
  .command('run')
  .description(
    'Run the automatic internationalization - equivalent to running extract, translate, and rewrite'
  )
  .action(async () => {
    const config = await getConfig();

    await doAll(config);
  });

program.parse(process.argv);

async function getConfig() {
  const configFilePath = path.resolve(
    process.cwd(),
    'i18n',
    'auto-intl.config.mjs'
  );

  console.log(configFilePath);

  if (!fs.existsSync(configFilePath)) {
    console.error('Config file not found');
    process.exit(1);
  }

  try {
    const config = await import(configFilePath);

    const projectConfig = config.default ? config.default : config;

    console.log('boo');
    console.log(projectConfig);
    console.log(createConfiguration(projectConfig));

    return createConfiguration(projectConfig);
  } catch (error) {
    console.error(`Error loading config file at ${configFilePath}:`, error);
    process.exit(1);
  }
}
