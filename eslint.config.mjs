import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import storybook from 'eslint-plugin-storybook';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import { trekkerPlugin } from './eslint.ui-plugin.mjs';

const TS_FILES = ['**/*.{ts,tsx}'];
const UI_FILES = ['ui/**/*.{ts,tsx}'];
const CONFIG_FILES = ['**/*.config.{js,ts}'];
const UI_CONFIG_FILES = ['.storybook/**/*.{ts,tsx}', 'vite.config.ts', 'vitest.config.ts'];

const inlineAwaitRestriction = {
  selector:
    'AwaitExpression:not(VariableDeclarator > AwaitExpression, AssignmentExpression > AwaitExpression, ExpressionStatement > AwaitExpression)',
  message:
    'Inline await is not allowed. Await on its own statement or assign the result first: `const value = await promise`.',
};

const defaultExportRestrictions = [
  {
    selector: 'ExportDefaultDeclaration',
    message: 'Default exports are not allowed. Use a named export.',
  },
  {
    selector: "ExportSpecifier[exported.name='default']",
    message: 'Default exports are not allowed. Use a named export.',
  },
];

const NON_ASCII_MESSAGE =
  'Non-ASCII characters are not allowed in source text. Use plain ASCII and an icon from react-icons for symbols.';

const nonAsciiRestrictions = [
  { selector: 'Literal[value=/[^\\x00-\\x7F]/]', message: NON_ASCII_MESSAGE },
  { selector: 'TemplateElement[value.raw=/[^\\x00-\\x7F]/]', message: NON_ASCII_MESSAGE },
  { selector: 'JSXText[value=/[^\\x00-\\x7F]/]', message: NON_ASCII_MESSAGE },
];

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/drizzle/**',
      '**/site/**',
      '**/bin/**',
      'storybook-static/**',
      'eslint.config.mjs',
      'eslint.ui-plugin.mjs',
      'drizzle.config.ts',
    ],
  },

  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    plugins: {
      unicorn,
    },
    rules: {
      'no-ternary': 'error',
      'no-nested-ternary': 'error',

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: false, allowAny: false, allowNullish: false },
      ],
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-extraneous-class': ['error', { allowStaticOnly: true }],
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      'no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
        },
      ],

      'no-else-return': ['error', { allowElseIf: false }],
      'no-lonely-if': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-return': 'error',

      'no-param-reassign': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      eqeqeq: ['error', 'always'],

      'no-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
      'no-useless-concat': 'error',
      'no-useless-rename': 'error',

      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/throw-new-error': 'error',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/no-for-loop': 'error',
      'unicorn/prefer-set-has': 'error',
      'unicorn/prefer-type-error': 'error',
      'unicorn/no-instanceof-array': 'error',
      'unicorn/error-message': 'error',
      'unicorn/no-typeof-undefined': 'error',
      'unicorn/prefer-regexp-test': 'error',
      'unicorn/prefer-at': 'error',
    },
  },

  // CLI commands use console and process.exit
  {
    files: ['src/commands/**/*.ts', 'src/index.ts'],
    rules: {
      'no-console': 'off',
      'unicorn/no-process-exit': 'off',
    },
  },

  {
    files: ['src/utils/output.ts', 'scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  {
    files: ['**/constants.ts', '**/schema.ts', '**/types/index.ts'],
    rules: {
      'no-magic-numbers': 'off',
    },
  },

  {
    files: ['tests/**/*.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      'no-magic-numbers': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  {
    files: UI_CONFIG_FILES,
    ...tseslint.configs.disableTypeChecked,
  },

  {
    files: [...UI_FILES, ...UI_CONFIG_FILES],
    rules: {
      'no-ternary': 'off',
      'no-magic-numbers': 'off',
    },
  },

  {
    files: TS_FILES,
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { trekker: trekkerPlugin, 'no-relative-import-paths': noRelativeImportPaths },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        inlineAwaitRestriction,
        ...defaultExportRestrictions,
        ...nonAsciiRestrictions,
      ],
      'trekker/one-component-per-file': 'error',
      'trekker/one-hook-per-file': 'error',
      'trekker/distinct-names': 'error',
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        { allowSameFolder: false, prefix: '@' },
      ],
    },
  },
  ...storybook.configs['flat/recommended'],
  {
    files: [...CONFIG_FILES, '**/*.stories.{ts,tsx}', '.storybook/**'],
    rules: {
      'no-restricted-syntax': ['error', inlineAwaitRestriction, ...nonAsciiRestrictions],
    },
  },
  {
    files: CONFIG_FILES,
    rules: {
      'no-relative-import-paths/no-relative-import-paths': 'off',
    },
  },
  {
    files: ['ui/alternatives/**/*.{ts,tsx}'],
    rules: {
      'trekker/one-component-per-file': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  eslintConfigPrettier,
  {
    files: TS_FILES,
    rules: {
      curly: ['error', 'all'],
      'arrow-body-style': ['error', 'always'],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  }
);
