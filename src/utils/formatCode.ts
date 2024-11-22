import { ESLint } from 'eslint';
import js from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import path from 'path';

async function lintAndFix(code: string): Promise<string> {
  // Create an ESLint instance with the desired configuration
  const eslint = new ESLint({
    fix: true, // Enable auto-fixing
    // overrideConfigFile: path.resolve('./eslint.configd.js'),
    overrideConfigFile: '/Users/ed/Code/helpmefind/.eslintrc.json',
  });

  // Lint the code
  const results = await eslint.lintText(code);

  console.log(results);
  console.log(results[0].messages);

  // Apply fixes if available
  if (results[0].output) {
    return results[0].output;
  }

  // Return the original code if no fixes were applied
  return code;
}

// Example usage
(async () => {
  const code = `
import { useTranslations } from 'next-intl';
import { CheckIcon } from '@heroicons/react/20/solid';
const tiers = [
  { name: 'FREE', id: 'tier-free', href: '#', priceMonthly: '$0' }
];
export default function Pricing() {
  return <div>{tiers.map((tier) => tier.name)}</div>;
}`;

  const fixedCode = await lintAndFix(code);
  console.log(fixedCode);
})();
