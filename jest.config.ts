require('dotenv').config({ path: '.env.test' });

const jestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {},
};

export default jestConfig;
