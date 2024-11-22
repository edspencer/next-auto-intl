import { duplicateNameDetector } from '../src/utils/duplicateNameDetector';

//raw collection of all detected strings
const allStrings = [
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
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/Period.tsx',
    componentName: 'Page',
    string: '/month',
    identifier: 'month',
  },
  {
    file: '/Users/ed/Code/next-auto-intl/test/fixtures/Plan.tsx',
    componentName: 'Page',
    string: 'Choose plan',
    identifier: 'choose-plan',
  },
];

describe('Detecting duplicate component names', () => {
  it('should detect components in different files that have the same component name', () => {
    const duplicates = duplicateNameDetector(allStrings);

    expect(duplicates).toEqual({
      Page: [
        '/Users/ed/Code/next-auto-intl/test/fixtures/Period.tsx',
        '/Users/ed/Code/next-auto-intl/test/fixtures/Plan.tsx',
      ],
    });
  });
});
