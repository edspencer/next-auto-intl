import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as assert from 'assert';
import * as os from 'os';
import chalk from 'chalk';

const execAsync = promisify(exec);

async function runIntegrationTests() {
  const apps = ['next-quiz', 'react'];

  for (const appName of apps) {
    console.log(chalk.blue(`\nTesting application: ${appName}`));
    try {
      await testApplication(appName);
      console.log(chalk.green(`\nTests passed for application: ${appName}`));
    } catch (error) {
      console.error(chalk.red(`\nTests failed for application: ${appName}`));
      console.error(error);
      process.exit(1);
    }
  }
  console.log(chalk.green('\nAll integration tests passed!'));
}

async function testApplication(appName: string) {
  const sourceDir = path.join(__dirname, 'examples', appName);
  // const tempDir = path.join(os.tmpdir(), `rai-test-${appName}-${Date.now()}`);
  const tempDir = path.join(
    __dirname,
    'int-test',
    `rai-test-${appName}-${Date.now()}`
  );

  console.log(`Copying application to temporary directory: ${tempDir}`);
  await fs.copy(sourceDir, tempDir);

  // Modify package.json to use local react-auto-intl
  const packageJsonPath = path.join(tempDir, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);

  // Assume the root directory is the directory containing the test script
  const rootDir = path.resolve(__dirname);

  // Add react-auto-intl as a dependency using the file protocol
  packageJson.dependencies = packageJson.dependencies || {};
  packageJson.dependencies['react-auto-intl'] = `file:${rootDir}`;

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  // Change working directory to the temporary directory
  process.chdir(tempDir);

  // Install dependencies
  console.log('Installing dependencies...');
  await execAsync('npm install');

  // Rest of your script remains the same...
  console.log('Running `npx rai generate`...');
  await execAsync('npx rai generate');

  // Copy and overwrite the prepared config file
  const preparedConfigPath = path.join(
    __dirname,
    'examples',
    appName,
    'auto-intl.config.example.js'
  );
  const targetConfigPath = path.join(tempDir, 'i18n', 'auto-intl.config.js');

  // Assert that the config file exists
  console.log('Checking that auto-intl.config.js exists...');
  assert.ok(
    await fs.pathExists(targetConfigPath),
    'auto-intl.config.js does not exist'
  );

  console.log('Copying prepared auto-intl.config.js...');
  await fs.copy(preparedConfigPath, targetConfigPath, { overwrite: true });

  console.log('Running `npx rai extract`...');
  await execAsync('npx rai extract');

  const enMessagesPath = path.join(tempDir, 'i18n', 'messages', 'en.json');
  console.log('Checking that i18n/messages/en.json exists...');
  assert.ok(await fs.pathExists(enMessagesPath), 'en.json does not exist');

  console.log('Running `npx rai rewrite`...');
  await execAsync('npx rai rewrite');

  console.log('Running `npx rai translate`...');
  await execAsync('npx rai translate');

  const ptMessagesPath = path.join(tempDir, 'i18n', 'messages', 'pt.json');
  console.log('Checking that i18n/messages/pt.json exists...');
  assert.ok(await fs.pathExists(ptMessagesPath), 'pt.json does not exist');

  console.log('Running `npx rai run`...');
  await execAsync('npx rai run');

  // Make assertions on the updated JSX files
  // await checkUpdatedFiles(appName, tempDir);
}

async function checkUpdatedFiles(appName: string, tempDir: string) {
  let sampleJsxPath: string;

  if (appName === 'react') {
    sampleJsxPath = path.join(tempDir, 'src', 'App.jsx'); // Adjust the path accordingly
  } else if (appName === 'next-quiz') {
    sampleJsxPath = path.join(tempDir, 'pages', 'index.js'); // Adjust the path accordingly
  } else {
    throw new Error(`Unknown application: ${appName}`);
  }

  console.log(`Checking that ${sampleJsxPath} has been updated...`);

  // Ensure the file exists
  assert.ok(
    await fs.pathExists(sampleJsxPath),
    `Sample JSX file does not exist at ${sampleJsxPath}`
  );

  const sampleJsxContent = await fs.readFile(sampleJsxPath, 'utf-8');

  // Check for expected changes
  assert.ok(
    sampleJsxContent.includes('<FormattedMessage'),
    'Expected FormattedMessage not found in the updated JSX file'
  );
}

runIntegrationTests()
  .then(() => {
    console.log(chalk.green('Integration tests passed!'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('Integration tests failed:'), error);
    process.exit(1);
  });
