import { parseFile } from '../src/utils/parser';
import { extractStrings } from '../src/extractStrings';
import path from 'path';

const expectedPricingStrings = [
  {
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/Pricing.tsx',
    componentName: 'Pricing',
    string: 'Pricing',
    identifier: 'pricing',
  },
  {
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/Pricing.tsx',
    componentName: 'Pricing',
    string: 'Free for most people, cheap for everyone else.',
    identifier: 'free-for-most-people-cheap',
  },
  {
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/Pricing.tsx',
    componentName: 'Pricing',
    string:
      'Track up to 100 items for free, or upgrade to a paid plan for more',
    identifier: 'track-up-to-100-items',
  },
  {
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/Pricing.tsx',
    componentName: 'Pricing',
    string: 'Most popular',
    identifier: 'most-popular',
  },
  {
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/Pricing.tsx',
    componentName: 'Pricing',
    string: '/month',
    identifier: 'month',
  },
  {
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/Pricing.tsx',
    componentName: 'Pricing',
    string: 'Choose plan',
    identifier: 'choose-plan',
  },
];

const expectedRegisterPageStrings = [
  {
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/RegisterPage.tsx',
    componentName: 'RegisterPage',
    string: 'Sign Up',
    identifier: 'sign-up',
  },
  {
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/RegisterPage.tsx',
    componentName: 'RegisterPage',
    string: 'Create an account with your email and password',
    identifier: 'create-an-account-with-your',
  },
  {
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/RegisterPage.tsx',
    componentName: 'RegisterPage',
    string: 'Sign Up',
    identifier: 'sign-up',
  },
  {
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/RegisterPage.tsx',
    componentName: 'RegisterPage',
    string: 'Sign in',
    identifier: 'sign-in',
  },
];

describe('extractStrings', () => {
  let pricingStrings: any;
  let registerPageStrings: any;

  beforeAll(() => {
    pricingStrings = getStrings('Pricing.tsx');
    registerPageStrings = getStrings('RegisterPage.tsx');
  });

  it('should extract the proper strings for RegisterPage', () => {
    expect(registerPageStrings).toEqual(expectedRegisterPageStrings);
  });

  it('should extract the proper strings for Pricing', () => {
    expect(pricingStrings).toEqual(expectedPricingStrings);
  });
});

function getStrings(fileName: string) {
  const file = path.join(__dirname, 'fixtures', fileName);
  const ast = parseFile(file);
  return extractStrings(ast, file);
}
