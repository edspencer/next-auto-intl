#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer').default;
const fs = require('fs');
const path = require('path');

program
  .name('next-auto-intl')
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

    console.log('\nThis will create a TypeScript or JavaScript file with the default configuration\n');

    const answers = await inquirer.prompt(questions);
    const configFilePath = path.resolve(process.cwd(), 'next-auto-intl.ts');

    fs.writeFileSync(configFilePath, fs.readFileSync(path.resolve(__dirname, './next-auto-intl.ts')));
    console.log(`Config file created at ${configFilePath}`);
  });

program.parse(process.argv);