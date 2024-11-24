# next-auto-intl

**next-auto-intl** automates the internationalization (i18n) process for Next.js applications. It builds on top of the excellent [next-intl](https://next-intl-docs.vercel.app/) library, automatically detecting all of the user-facing strings in your React components, pulling them out into a next-intl JSON file, using an LLM to translate them into any number of languages you like, and even **updates your React code automatically** to use the translation files.

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

---

## Usage

### 1. Basic Setup

Run **next-auto-intl** on your Next.js project to extract strings, update source files, and generate JSON message files.

```javascript
import { autoI18n } from 'next-auto-intl';

autoI18n({
  scanDirs: ['./pages', './components'], // Directories to scan for components
  baseLanguage: 'en', // The base language for the application
  targetLanguages: ['fr', 'es'], // Optional: target languages for translation
  messagesDir: './messages', // Directory to store translation JSON files
  rewriteSourceFiles: true, // Enable source file updates
  lintAfterRewrite: true, // Run eslint --fix after rewriting files
});
```

---

### 2. Example Workflow

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
        {t('at-any-time')}
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
    "at-any-time": "at any time to create an account and keep all the items you added."
  }
}
```

---

### 3. Configuration

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
};
```

---

## Advanced Features

### Automated Translations with LLM

Enable automated translations using your preferred LLM (e.g., OpenAI's GPT), or other technique:

```javascript
autoI18n({
  targetLanguages: ['fr', 'de'],
  translate: async (strings, targetLanguage) => {
    // Use an LLM to translate strings into the target language
    const translations = await myLLM.translate(strings, targetLanguage);
    return translations;
  },
});
```

### Cleanup Unused Translations

Remove unused translation keys from JSON files:

```javascript
autoI18n({
  deleteUnusedTranslations: true,
});
```

---

## CLI (Coming Soon)

We are working on adding CLI support to run **next-auto-intl** directly from the terminal.

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests on the [GitHub repository](https://github.com/edspencer/next-auto-intl).

---

## License

MIT License
