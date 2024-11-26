import { parseFile } from '../src/utils/parser';
import { extractStrings } from '../src/extractStrings';
import path from 'path';
import { StringInfo } from '../src/types';

const sortByIdentifier = (a: StringInfo, b: StringInfo) =>
  a.identifier < b.identifier ? -1 : 1;

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
].sort(sortByIdentifier);

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
].sort(sortByIdentifier);

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
].sort(sortByIdentifier);

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
        alreadyUpdated: true,
      },
      {
        file: path.resolve(__dirname, 'fixtures', 'PartiallyUpdated.tsx'),
        componentName: 'RegisterPage',
        string: 'Create an account with your email and password',
        identifier: 'create-an-account-with-your',
        alreadyUpdated: true,
      },
      {
        file: path.resolve(__dirname, 'fixtures', 'PartiallyUpdated.tsx'),
        componentName: 'RegisterPage',
        string: 'Sign Up',
        identifier: 'sign-up',
        alreadyUpdated: true,
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
        alreadyUpdated: true,
      },
      {
        file: path.resolve(__dirname, 'fixtures', 'PartiallyUpdated.tsx'),
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

    expect(strings).toEqual(newStrings);
  });

  describe('various ways of defining React components', () => {
    it('should extract strings from a React component defined as a function declaration', () => {
      const strings = getStrings('comp-formats/FunctionDeclaration.tsx', {
        ComprehensiveTestComponent: {
          'already-translated-title': 'Already translated title',
          'welcome-to-myapp': 'Welcome to MyApp',
        },
      });

      expect(expectedStringsForCompFile('FunctionDeclaration.tsx')).toEqual(
        strings
      );
    });

    it('should extract strings from a React component defined as a arrow function', () => {
      const strings = getStrings('comp-formats/ArrowFunction.tsx', {
        ComprehensiveTestComponent: {
          'already-translated-title': 'Already translated title',
          'welcome-to-myapp': 'Welcome to MyApp',
        },
      });

      expect(expectedStringsForCompFile('ArrowFunction.tsx')).toEqual(strings);
    });

    it('should extract strings from a React component defined as a class', () => {
      const strings = getStrings('comp-formats/ExportClass.tsx', {
        ComprehensiveTestComponent: {
          'already-translated-title': 'Already translated title',
          'welcome-to-myapp': 'Welcome to MyApp',
        },
      });

      expect(expectedStringsForCompFile('ExportClass.tsx')).toEqual(strings);
    });

    it('should extract strings from a React component defined as a class', () => {
      const strings = getStrings('comp-formats/ForwardRef.tsx', {
        ComprehensiveTestComponent: {
          'already-translated-title': 'Already translated title',
          'welcome-to-myapp': 'Welcome to MyApp',
        },
      });

      expect(expectedStringsForCompFile('ForwardRef.tsx')).toEqual(strings);
    });

    it.failing(
      'should extract strings from a React component defined as an HOC',
      () => {
        const strings = getStrings('comp-formats/HOC.tsx', {
          ComprehensiveTestComponent: {
            'already-translated-title': 'Already translated title',
            'welcome-to-myapp': 'Welcome to MyApp',
          },
        });

        expect(expectedStringsForCompFile('HOC.tsx')).toEqual(strings);
      }
    );

    it('should extract strings from an implicit return function', () => {
      const strings = getStrings(
        'comp-formats/ArrowFunctionImplicitReturn.tsx',
        {
          ImplicitReturnComponent: {
            'hello-world': 'Hello World',
          },
        }
      );

      const expected = [
        {
          file: path.resolve(
            __dirname,
            'fixtures',
            'comp-formats',
            'ArrowFunctionImplicitReturn.tsx'
          ),
          componentName: 'ImplicitReturnComponent',
          string: 'Hello World',
          identifier: 'hello-world',
        },
      ];

      expect(expected).toEqual(strings);
    });

    it('should extract strings from an stateless FC', () => {
      const strings = getStrings(
        'comp-formats/StatelessFunctionalComponent.tsx',
        {
          MinimalComponent: {
            'minimal-component': 'Minimal Component',
          },
        }
      );

      const expected = [
        {
          file: path.resolve(
            __dirname,
            'fixtures',
            'comp-formats',
            'StatelessFunctionalComponent.tsx'
          ),
          componentName: 'MinimalComponent',
          string: 'Minimal Component',
          identifier: 'minimal-component',
        },
      ];

      expect(expected).toEqual(strings);
    });

    it('should extract strings from fragment wrappers', () => {
      const strings = getStrings('comp-formats/FragmentWrapper.tsx', {
        FragmentComponent: {
          'part-1': 'Part 1',
          'part-2': 'Part 2',
        },
      });

      const expected = [
        {
          file: path.resolve(
            __dirname,
            'fixtures',
            'comp-formats',
            'FragmentWrapper.tsx'
          ),
          componentName: 'FragmentComponent',
          string: 'Part 1',
          identifier: 'part-1',
        },
        {
          file: path.resolve(
            __dirname,
            'fixtures',
            'comp-formats',
            'FragmentWrapper.tsx'
          ),
          componentName: 'FragmentComponent',
          string: 'Part 2',
          identifier: 'part-2',
        },
      ];

      expect(expected).toEqual(strings);
    });

    it('should extract strings from all JSX blocks if the component renders conditionally', () => {
      const strings = getStrings('comp-formats/ConditionalComponent.tsx', {
        ConditionalComponent: {
          'welcome-back': 'Welcome Back',
          'please-log-in': 'Please Log In',
        },
      });

      const expected = [
        {
          file: path.resolve(
            __dirname,
            'fixtures',
            'comp-formats',
            'ConditionalComponent.tsx'
          ),
          componentName: 'ConditionalComponent',
          string: 'Please Log In',
          identifier: 'please-log-in',
        },
        {
          file: path.resolve(
            __dirname,
            'fixtures',
            'comp-formats',
            'ConditionalComponent.tsx'
          ),
          componentName: 'ConditionalComponent',
          string: 'Welcome Back',
          identifier: 'welcome-back',
        },
      ];

      expect(expected).toEqual(strings);
    });
  });

  it.failing('should extract strings from inline logical expressions', () => {
    const strings = getStrings('comp-formats/InlineLogic.tsx', {
      InlineLogic: {
        'welcome-premium-user': 'Welcome, Premium User!',
        'upgrade-to-premium': 'Upgrade to Premium',
        'exclusive-feature': 'Exclusive Feature',
      },
    });

    const expected = [
      {
        file: path.resolve(
          __dirname,
          'fixtures',
          'comp-formats',
          'InlineLogic.tsx'
        ),
        componentName: 'InlineLogic',
        string: 'Welcome, Premium User!',
        identifier: 'welcome-premium-user',
      },
      {
        file: path.resolve(
          __dirname,
          'fixtures',
          'comp-formats',
          'InlineLogic.tsx'
        ),
        componentName: 'InlineLogic',
        string: 'Upgrade to Premium',
        identifier: 'upgrade-to-premim',
      },
      {
        file: path.resolve(
          __dirname,
          'fixtures',
          'comp-formats',
          'InlineLogic.tsx'
        ),
        componentName: 'InlineLogic',
        string: 'Exclusive Feature',
        identifier: 'exclusive-feature',
      },
    ];

    expect(expected).toEqual(strings);
  });

  it('should extract strings from inline logical expressions', () => {
    const strings = getStrings('comp-formats/SelfClosing.tsx', {
      SelfClosingComponent: {
        logo: 'Logo',
      },
    });

    const expected = [
      {
        file: path.resolve(
          __dirname,
          'fixtures',
          'comp-formats',
          'SelfClosing.tsx'
        ),
        componentName: 'SelfClosingComponent',
        string: 'Logo',
        identifier: 'logo',
      },
    ];

    expect(expected).toEqual(strings);
  });

  it('should ignore strings passed in to child components if they are not user-facing strings', () => {
    const strings = getStrings('comp-formats/ParentComponent.tsx', {
      ParentComponent: {
        'hello-world': 'Hello  World',
      },
    });

    //the "Hello from Parent" string should not be extracted
    const expected = [
      {
        file: path.resolve(
          __dirname,
          'fixtures',
          'comp-formats',
          'ParentComponent.tsx'
        ),
        componentName: 'ParentComponent',
        string: 'Hello World',
        identifier: 'hello-world',
      },
    ];

    expect(expected).toEqual(strings);
  });
});

function expectedStringsForCompFile(filename: string) {
  return expectedStringsCompTest
    .map((string) => ({
      ...string,
      file: path.resolve(__dirname, 'fixtures', 'comp-formats', filename),
    }))
    .sort(sortByIdentifier);
}

const expectedStringsCompTest = [
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'Welcome to the Test!',
    identifier: 'welcome-to-the-test',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'This is a comprehensive test case.',
    identifier: 'this-is-a-comprehensive-test',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'This is a test image',
    identifier: 'this-is-a-test-image',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'Image title here',
    identifier: 'image-title-here',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'Enter your name',
    identifier: 'enter-your-name',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'Name input field',
    identifier: 'name-input-field',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'This is inside curly braces.',
    identifier: 'this-is-inside-curly-braces',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'Another tricky string with spaces and punctuation!',
    identifier: 'another-tricky-string-with-spaces',
    isExpression: true,
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'Nested',
    identifier: 'nested',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'string inside a tag',
    identifier: 'string-inside-a-tag',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'for more coverage.',
    identifier: 'for-more-coverage',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'Test Link Title',
    identifier: 'test-link-title',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'Click here',
    identifier: 'click-here',
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'Already translated title',
    identifier: 'already-translated-title',
    alreadyUpdated: true,
  },
  {
    file: '/path/to/fixtures',
    componentName: 'ComprehensiveTestComponent',
    string: 'Welcome to MyApp',
    identifier: 'welcome-to-myapp',
    alreadyUpdated: true,
  },
];

function getStrings(fileName: string, baseLanguageStrings?: any) {
  const file = path.join(__dirname, 'fixtures', fileName);
  const ast = parseFile(file);

  return extractStrings(ast, file, baseLanguageStrings).sort(sortByIdentifier);
}
