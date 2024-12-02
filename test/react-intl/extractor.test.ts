import path from 'path';
import { parseFile } from '../../src/utils/parser';
import { ReactIntlExtractor } from '../../src/react-intl/extractor';
import { StringInfo, MessagesObject } from '../../src/types';

const sortByIdentifier = (a: StringInfo, b: StringInfo) =>
  a.identifier < b.identifier ? -1 : 1;

function getStrings(fileName: string, baseLanguageStrings?: MessagesObject) {
  const filePath = path.resolve(
    __dirname,
    '..',
    'fixtures',
    'react-intl',
    fileName
  );
  const ast = parseFile(filePath);
  const extractor = new ReactIntlExtractor(
    ast,
    filePath,
    baseLanguageStrings || {}
  );
  return extractor.extractStrings().sort(sortByIdentifier);
}

const expectedPricingStrings = [
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'Pricing.tsx'
    ),
    componentName: 'Pricing',
    string: 'Pricing',
    identifier: 'pricing',
  },
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'Pricing.tsx'
    ),
    componentName: 'Pricing',
    string: 'Free for most people, cheap for everyone else.',
    identifier: 'free-for-most-people-cheap',
  },
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'Pricing.tsx'
    ),
    componentName: 'Pricing',
    string:
      'Track up to 100 items for free, or upgrade to a paid plan for more',
    identifier: 'track-up-to-100-items',
  },
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'Pricing.tsx'
    ),
    componentName: 'Pricing',
    string: 'Most popular',
    identifier: 'most-popular',
  },
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'Pricing.tsx'
    ),
    componentName: 'Pricing',
    string: '/month',
    identifier: 'month',
  },
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'Pricing.tsx'
    ),
    componentName: 'Pricing',
    string: 'Choose plan',
    identifier: 'choose-plan',
  },
].sort(sortByIdentifier);

const expectedRegisterPageStrings = [
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'RegisterPage.tsx'
    ),
    componentName: 'RegisterPage',
    string: 'Sign Up',
    identifier: 'sign-up',
  },
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'RegisterPage.tsx'
    ),
    componentName: 'RegisterPage',
    string: 'Create an account with your email and password',
    identifier: 'create-an-account-with-your',
  },
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'RegisterPage.tsx'
    ),
    componentName: 'RegisterPage',
    string: 'Sign Up',
    identifier: 'sign-up',
  },
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'RegisterPage.tsx'
    ),
    componentName: 'RegisterPage',
    string: 'Already have an account?',
    identifier: 'already-have-an-account',
  },
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'RegisterPage.tsx'
    ),
    componentName: 'RegisterPage',
    string: 'Sign in',
    identifier: 'sign-in',
  },
  {
    file: path.resolve(
      __dirname,
      '..',
      'fixtures',
      'react-intl',
      'RegisterPage.tsx'
    ),
    componentName: 'RegisterPage',
    string: 'instead.',
    identifier: 'instead',
  },
].sort(sortByIdentifier);

const expectedItemsStrings = [
  {
    file: path.resolve(__dirname, '..', 'fixtures', 'react-intl', 'Items.tsx'),
    componentName: 'Items',
    string: 'Loading...',
    identifier: 'loading',
  },
  {
    file: path.resolve(__dirname, '..', 'fixtures', 'react-intl', 'Items.tsx'),
    componentName: 'Items',
    string: 'Items',
    identifier: 'items',
  },
].sort(sortByIdentifier);

describe('ReactIntlExtractor', () => {
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
    xit.only(
      'should extract strings for a component that has already been partly internationalized',
      () => {
        const newStrings = [
          {
            file: path.resolve(
              __dirname,
              '..',
              'fixtures',
              'react-intl',
              'PartiallyUpdated.tsx'
            ),
            componentName: 'RegisterPage',
            string: 'Sign Up',
            identifier: 'sign-up',
            alreadyUpdated: true,
          },
          {
            file: path.resolve(
              __dirname,
              '..',
              'fixtures',
              'react-intl',
              'PartiallyUpdated.tsx'
            ),
            componentName: 'RegisterPage',
            string: 'Create an account with your email and password',
            identifier: 'create-an-account-with-your',
            alreadyUpdated: true,
          },
          {
            file: path.resolve(
              __dirname,
              '..',
              'fixtures',
              'react-intl',
              'PartiallyUpdated.tsx'
            ),
            componentName: 'RegisterPage',
            string: 'Sign Up',
            identifier: 'sign-up',
            alreadyUpdated: true,
          },
          {
            file: path.resolve(
              __dirname,
              '..',
              'fixtures',
              'react-intl',
              'PartiallyUpdated.tsx'
            ),
            componentName: 'RegisterPage',
            string: 'Already have an account?',
            identifier: 'already-have-an-account',
          },
          {
            file: path.resolve(
              __dirname,
              '..',
              'fixtures',
              'react-intl',
              'PartiallyUpdated.tsx'
            ),
            componentName: 'RegisterPage',
            string: 'Sign in',
            identifier: 'sign-in',
            alreadyUpdated: true,
          },
          {
            file: path.resolve(
              __dirname,
              '..',
              'fixtures',
              'react-intl',
              'PartiallyUpdated.tsx'
            ),
            componentName: 'RegisterPage',
            string: 'instead.',
            identifier: 'instead',
          },
        ].sort(sortByIdentifier);

        const strings = getStrings('PartiallyUpdated.tsx', {
          //these are the strings that were already extracted from the RegisterPage component
          RegisterPage: {
            'create-an-account-with-your':
              'Create an account with your email and password',
            'sign-in': 'Sign in',
            'sign-up': 'Sign Up',
          },
        });

        console.log(strings);

        expect(strings).toEqual(newStrings);
      }
    );
  });
});
