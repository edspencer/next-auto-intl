require('dotenv').config({ path: '.env.test' });

const jestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {},
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default jestConfig;
