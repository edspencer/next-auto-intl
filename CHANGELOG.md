# react-auto-intl

## 0.5.1

### Patch Changes

- 212b300: Fixed CJS build issues

## 0.5.0

### Minor Changes

- d1b4a90: Change name to react-auto-intl
- d1b4a90: Added react-intl support

### Patch Changes

- d1b4a90: Refactored saveTranslations to make them per-targetLibrary

## 0.4.0

### Minor Changes

- 13817ff: Added lintCommand configuration option
- 13817ff: Allow configuration of scanFiles and scanFileTypes
- 13817ff: Support other i18n frameworks beyond next-intl
- 13817ff: Support class declaration components

### Patch Changes

- 13817ff: Added createConfiguration helper

## 0.3.0

### Minor Changes

- 1742824: Added npx nai scan
- 7aaeddb: Optimization: don't re-translate strings we already have translations for

### Patch Changes

- 064c32d: Parallelized rewriteComponents - much faster
- a70bb08: Fix missing deep merge when updating translations
- 1742824: Stop pulling out strings without any letters

## 0.2.0

### Minor Changes

- ef6bd35: Added lintAfterRewrite config option
- 242b4f6: Better CLI commands
- ed01782: Added parallelTranslations config

### Patch Changes

- d33f2aa: Removed vestigial dependencies

## 0.1.1

### Patch Changes

- 815c373: Build and release tooling
