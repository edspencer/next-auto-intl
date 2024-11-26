import { parseFile } from '../src/utils/parser';
import { extractStrings } from '../src/extractStrings';
import path from 'path';

const expectedPricingStrings = [
  {
    file: path.resolve(__dirname, 'fixtures', 'Pricing.tsx'),
    componentName: 'Pricing',
    string: 'Pricing',
    identifier: 'pricing',
  },
  {
    file: path.resolve(__dirname, 'fixtures', 'Pricing.tsx'),
    componentName: 'Pricing',
    string: 'Free for most people, cheap for everyone else.',
    identifier: 'free-for-most-people-cheap',
  },
  {
    file: path.resolve(__dirname, 'fixtures', 'Pricing.tsx'),
    componentName: 'Pricing',
    string:
      'Track up to 100 items for free, or upgrade to a paid plan for more',
    identifier: 'track-up-to-100-items',
  },
  {
    file: path.resolve(__dirname, 'fixtures', 'Pricing.tsx'),
    componentName: 'Pricing',
    string: 'Most popular',
    identifier: 'most-popular',
  },
  {
    file: path.resolve(__dirname, 'fixtures', 'Pricing.tsx'),
    componentName: 'Pricing',
    string: '/month',
    identifier: 'month',
  },
  {
    file: path.resolve(__dirname, 'fixtures', 'Pricing.tsx'),
    componentName: 'Pricing',
    string: 'Choose plan',
    identifier: 'choose-plan',
  },
];

const expectedRegisterPageStrings = [
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
    string: 'Already have an account?',
    identifier: 'already-have-an-account',
  },
  {
    file: path.resolve(__dirname, 'fixtures', 'RegisterPage.tsx'),
    componentName: 'RegisterPage',
    string: 'Sign in',
    identifier: 'sign-in',
  },
  {
    file: path.resolve(__dirname, 'fixtures', 'RegisterPage.tsx'),
    componentName: 'RegisterPage',
    string: 'instead.',
    identifier: 'instead',
  },
];

const expectedItemsStrings = [
  {
    file: path.resolve(__dirname, 'fixtures', 'Items.tsx'),
    componentName: 'Items',
    string: 'Loading...',
    identifier: 'loading',
  },
  {
    file: path.resolve(__dirname, 'fixtures', 'Items.tsx'),
    componentName: 'Items',
    string: 'Items',
    identifier: 'items',
  },
];

describe('extractStrings', () => {
  let pricingStrings: any;
  let registerPageStrings: any;
  let itemsStrings: any;

  beforeAll(() => {
    pricingStrings = getStrings('Pricing.tsx');
    registerPageStrings = getStrings('RegisterPage.tsx');
    itemsStrings = getStrings('Items.tsx');
  });

  it('should extract the proper strings for RegisterPage', () => {
    expect(registerPageStrings).toEqual(expectedRegisterPageStrings);
  });

  it('should extract the proper strings for Pricing', () => {
    expect(pricingStrings).toEqual(expectedPricingStrings);
  });

  //this React component has a '(' and a ')' in it, which should be ignored
  it('should not create strings for pieces of standalone punctuation', () => {
    expect(itemsStrings).toEqual(expectedItemsStrings);
  });

  //this React component is the same Register page, but there are 2 new strings that should be extracted
  it('should extract strings for a component that has already been partly internationalized', () => {
    const newStrings = [
      {
        file: path.resolve(__dirname, 'fixtures', 'PartiallyUpdated.tsx'),
        componentName: 'RegisterPage',
        string: 'Sign Up',
        identifier: 'sign-up',
      },
      {
        file: path.resolve(__dirname, 'fixtures', 'PartiallyUpdated.tsx'),
        componentName: 'RegisterPage',
        string: 'Create an account with your email and password',
        identifier: 'create-an-account-with-your',
      },
      {
        file: path.resolve(__dirname, 'fixtures', 'PartiallyUpdated.tsx'),
        componentName: 'RegisterPage',
        string: 'Sign Up',
        identifier: 'sign-up',
      },
      {
        file: path.resolve(__dirname, 'fixtures', 'PartiallyUpdated.tsx'),
        componentName: 'RegisterPage',
        string: 'Already have an account?',
        identifier: 'already-have-an-account',
      },
      {
        file: path.resolve(__dirname, 'fixtures', 'PartiallyUpdated.tsx'),
        componentName: 'RegisterPage',
        string: 'Sign in',
        identifier: 'sign-in',
      },
      {
        file: path.resolve(__dirname, 'fixtures', 'PartiallyUpdated.tsx'),
        componentName: 'RegisterPage',
        string: 'instead.',
        identifier: 'instead',
      },
    ];

    const strings = getStrings('PartiallyUpdated.tsx', {
      //these are the strings that were already extracted from the RegisterPage component
      RegisterPage: {
        'create-an-account-with-your':
          'Create an account with your email and password',
        'sign-in': 'Sign in',
        'sign-up': 'Sign Up',
      },
    });

    expect(strings).toEqual(newStrings);
  });
});

function getStrings(fileName: string, baseLanguageStrings?: any) {
  const file = path.join(__dirname, 'fixtures', fileName);
  const ast = parseFile(file);

  return extractStrings(ast, file, baseLanguageStrings);
}
