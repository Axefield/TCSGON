// ESLint flat config — AGENTS.md §3 compliant.
// Strict TS + React + a11y + import ordering + prettier compatibility.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.vite/**',
      'node_modules/**',
      'src/**/__tests__/**',
      '**/*.d.ts',
    ],
  },

  // Base JS recommended
  js.configs.recommended,

  // TypeScript recommended (no type-checked rules to keep runtime fast;
  // tsc --noEmit enforces types separately per AGENTS.md §3).
  ...tseslint.configs.recommended,

  // React + hooks + a11y for source files
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
        node: true,
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // AGENTS.md §3 forbids `any` and `@ts-ignore` without ticket.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',

      // React 18 — new JSX transform is default; no need to import React.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Import ordering
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-default-export': 'off',
    },
  },

  // Test files: relax a few rules that conflict with RTL patterns
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}', 'e2e/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'react/jsx-no-constructed-context-values': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },

  // Config files: allow node globals
  {
    files: [
      '*.config.{js,ts,mjs,cjs}',
      'vitest.config.ts',
      'vite.config.ts',
      'playwright.config.ts',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Prettier last — disables conflicting style rules.
  prettierConfig,
);