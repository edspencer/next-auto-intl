import { convertToComponentStrings } from '../src/utils/convertToComponentStrings';

//raw collection of all detected strings
const allStrings = [
  {
    file: '/Users/ed/Code/react-auto-intl/test/fixtures/Pricing.tsx',
    componentName: 'Pricing',
    string: 'Pricing',
    identifier: 'pricing',
  },
  {
    file: '/Users/ed/Code/react-auto-intl/test/fixtures/Pricing.tsx',
    componentName: 'Pricing',
    string: 'Free for most people, cheap for everyone else.',
    identifier: 'free-for-most-people-cheap',
  },
  {
    file: '/Users/ed/Code/react-auto-intl/test/fixtures/Pricing.tsx',
    componentName: 'Pricing',
    string:
      'Track up to 100 items for free, or upgrade to a paid plan for more',
    identifier: 'track-up-to-100-items',
  },
  {
    file: '/Users/ed/Code/react-auto-intl/test/fixtures/Pricing.tsx',
    componentName: 'Pricing',
    string: 'Most popular',
    identifier: 'most-popular',
  },
  {
    file: '/Users/ed/Code/react-auto-intl/test/fixtures/Period.tsx',
    componentName: 'Period',
    string: '/month',
    identifier: 'month',
  },
  {
    file: '/Users/ed/Code/react-auto-intl/test/fixtures/Plan.tsx',
    componentName: 'Plan',
    string: 'Choose plan',
    identifier: 'choose-plan',
  },
];

//expected output conversion
const expectedPricingStrings = [
  {
    file: '/Users/ed/Code/react-auto-intl/test/fixtures/Pricing.tsx',
    componentName: 'Pricing',
    strings: [
      {
        file: '/Users/ed/Code/react-auto-intl/test/fixtures/Pricing.tsx',
        componentName: 'Pricing',
        string: 'Pricing',
        identifier: 'pricing',
      },
      {
        file: '/Users/ed/Code/react-auto-intl/test/fixtures/Pricing.tsx',
        componentName: 'Pricing',
        string: 'Free for most people, cheap for everyone else.',
        identifier: 'free-for-most-people-cheap',
      },
      {
        file: '/Users/ed/Code/react-auto-intl/test/fixtures/Pricing.tsx',
        componentName: 'Pricing',
        string:
          'Track up to 100 items for free, or upgrade to a paid plan for more',
        identifier: 'track-up-to-100-items',
      },
      {
        file: '/Users/ed/Code/react-auto-intl/test/fixtures/Pricing.tsx',
        componentName: 'Pricing',
        string: 'Most popular',
        identifier: 'most-popular',
      },
    ],
  },
  {
    file: '/Users/ed/Code/react-auto-intl/test/fixtures/Period.tsx',
    componentName: 'Period',
    strings: [
      {
        file: '/Users/ed/Code/react-auto-intl/test/fixtures/Period.tsx',
        componentName: 'Period',
        string: '/month',
        identifier: 'month',
      },
    ],
  },
  {
    file: '/Users/ed/Code/react-auto-intl/test/fixtures/Plan.tsx',
    componentName: 'Plan',
    strings: [
      {
        file: '/Users/ed/Code/react-auto-intl/test/fixtures/Plan.tsx',
        componentName: 'Plan',
        string: 'Choose plan',
        identifier: 'choose-plan',
      },
    ],
  },
];

describe('convertToComponentStrings', () => {
  it('should convert Pricing strings properly', async () => {
    const componentStrings = await convertToComponentStrings(allStrings);

    expect(componentStrings).toEqual(expectedPricingStrings);
  });
});
