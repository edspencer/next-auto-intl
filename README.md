# Internationalization, meet AI

**next-auto-intl** automates the internationalization (i18n) process for Next.js applications. It builds on top of the excellent [next-intl](https://next-intl-docs.vercel.app/) library, and does 3 things:

**1.** automatically detects all of the user-facing strings in your React components, **extracting** into a next-intl JSON file
**2.** optionally **rewrites** your JSX components to use `next-intl` instead of hard-coded strings
**3.** automatically **translates** all of the user-facing strings into any number of languages, using an LLM of your choice

## Features

- **Automatic String Extraction**: Detects and extracts user-facing strings from JSX elements and attributes like `placeholder`, `title`, `aria-label`, etc.
- **Source File Updates**: Replaces hardcoded strings in your React components with translation calls using `useTranslations`.
- **JSON Message File Management**: Generates and updates language-specific JSON files for `next-intl`.
- **LLM Integration**: Supports automated translations into target languages using an LLM (optional).
- **Eslint Integration**: Runs `eslint --fix` on updated source files for consistent formatting.

---

## Installation

Install the library via npm or yarn:

```bash
npm install next-auto-intl
```

or

```bash
yarn add next-auto-intl
```

By default, `next-auto-intl` will use OpenAI's `gpt-4o-mini` model to perform translations, so you need to have this environment variable set somewhere:

```sh
OPENAI_API_KEY="your-openai-api-key"
```

---

## Usage

### 1. Basic Configuration

Generate the `next-auto-intl` config file:

```sh
npx nai generate
```

This will create `i18n/auto-intl.config.mjs`, which looks like this by default:

```javascript
//These are all actually the default values, shown here just so you can see the options
const config = {
  scanDirs: ['./app', './components'], // Directories to scan for components
  baseLanguage: 'en', // The base language for the application
  targetLanguages: ['fr', 'pt'], // Optional: target languages for translation
  messagesDir: './i81n/messages', // Directory to store translation JSON files
  rewriteSourceFiles: true, // Enable source file updates
  lintAfterRewrite: true, // Run eslint --fix after rewriting files
};

export default config;
```

See further down this file for a full explanation of the various Configuration options.

### 2. Auto-Internationalizing

`next-auto-intl` does 3 things:

1. Extracts all user-facing strings in your JSX components and writes them to {baseLanguage}.json
2. Rewrites JSX with hard-coded strings to pull the value from {someLanguage}.json
3. Translates {baseLanguage}.json into up to 40 other languages, using an LLM of your choice

To do all 3, run this command:

```sh
npx nai run
```

This will spit out a bunch of logs as it goes through the extraction, rewriting and translation process. It's a good idea to do this on a clean new branch, as the `rewrite` step is going to modify your source code (see example below).

It is safe to run the task any number of times. If you've already started adding `next-intl` to your app, `next-auto-intl` should run just fine to finish the string extract process for you.

After this command has run, you should see `en.json` fully populated, all of your JSX React components with hard-coded strings updated to use the `next-intl` string, and full translation files also created for whichever languages you specified you want support for.

### 3. Example Output

Let's say you have this component:

#### Input Component

```tsx
export const GuestModeMessage = ({ delay }: { delay?: number }) => {
  return (
    <div className="bg-yellow-50 p-2 rounded-lg text-sm">
      <p>
        You&apos;re using <strong>guest mode</strong>. Click{' '}
        <Link className="font-bold underline" href="/api/auth/signin">
          register
        </Link>{' '}
        at any time to create an account and keep all the items you added.
      </p>
    </div>
  );
};
```

#### Output Component (Updated)

After running the `rewrite` phase of the process, the component will have been updated to look like this:

```tsx
import { useTranslations } from 'next-intl';

export const GuestModeMessage = ({ delay }: { delay?: number }) => {
  const t = useTranslations('GuestModeMessage');

  return (
    <div className="bg-yellow-50 p-2 rounded-lg text-sm">
      <p>
        {t('youre-using')} <strong>{t('guest-mode')}</strong>. {t('click')}{' '}
        <Link className="font-bold underline" href="/api/auth/signin">
          {t('register')}
        </Link>{' '}
        {t('at-any-time-to-create')}
      </p>
    </div>
  );
};
```

#### Generated JSON (`messages/en.json`)

```json
{
  "GuestModeMessage": {
    "youre-using": "You're using",
    "guest-mode": "guest mode",
    "click": "Click",
    "register": "register",
    "at-any-time-to-create": "at any time to create an account and keep all the items you added."
  }
}
```

#### Generated JSON (`messages/fr.json`)

```json
{
  "GuestModeMessage": {
    "youre-using": "Vous utilisez",
    "guest-mode": "mode invité",
    "click": ". Cliquez",
    "register": "s'inscrire",
    "at-any-time-to-create": "à tout moment pour créer un compte et conserver tous les éléments que vous avez ajoutés."
  }
}
```

#### Generated JSON (`messages/pt.json`)

```json
{
  "GuestModeMessage": {
    "youre-using": "Você está usando",
    "guest-mode": "modo convidado",
    "click": ". Clique",
    "register": "registrar",
    "at-any-time-to-create": "a qualquer momento para criar uma conta e manter todos os itens que você adicionou."
  }
}
```

---

### 4. Configuration

Pass a configuration object to customize the behavior of **next-auto-intl**.

```typescript
export type Configuration = {
  scanDirs: string[]; // Directories to scan for components
  baseLanguage: string; // Base language (e.g., "en")
  targetLanguages?: string[]; // Optional: target languages for translations
  messagesDir?: string; // Directory for JSON message files
  allowDuplicateComponentNames?: boolean; // Allow duplicate component names across files
  rewriteSourceFiles?: boolean; // Rewrite source files with translation hooks
  lintAfterRewrite?: boolean; // Run eslint --fix after updating files
  deleteUnusedTranslations?: boolean; // Delete unused keys from JSON files
  componentWhitelist?: string[]; // Only process specific components
  parallelTranslations: 5; //max number of parallelization jobs to run in parallel
};
```

---

### 5. Extract Job

To just extract all the detected strings in your JSX components and write them to `i18n/messages/en.json` (assuming your configured `baseLanguage` is set to `en`), just run this command:

```sh
npx nai extract
```

It is safe to run the task any number of times.

### 6. Rewrite Job

The `rewrite` phase iterates through all of strings in `i18n/messages/en.json` and updates all of the JSX components

It is safe to run the task any number of times.

### 7. Translating without rewriting

If you don't want `next-auto-intl` to rewrite your source files for you, but you do still want it to find all the strings and translate them for you, just run the 2 commands:

```sh
npx nai extract
npx nai translate
```

This will create a `{someLanguage}.json` file for each language in the `targetLanguages` config array, as well as the `en.json` original strings (assuming your `baseLanguage` is `en`). You can also set the `rewriteSourceFiles` config to `false` and then run the full `npx nai run` command and it will skip the rewriting step.

## Contributing

Contributions are welcome! Please open issues or submit pull requests on the [GitHub repository](https://github.com/edspencer/next-auto-intl).

---

## License

MIT License
