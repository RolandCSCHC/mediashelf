import globals from 'globals';
import tseslint from 'typescript-eslint';
import { baseConfig } from './base.js';

/** @type {import('typescript-eslint').ConfigArray} */
export const nestConfig = tseslint.config(...baseConfig, {
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
  rules: {
    // NestJS relies on decorator metadata; type-only imports can break DI.
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
});

export default nestConfig;
