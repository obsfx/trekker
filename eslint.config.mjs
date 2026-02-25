import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import unicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/drizzle/**',
      '**/site/**',
      '**/bin/**',
      'eslint.config.mjs',
      'drizzle.config.ts',
    ],
  },

  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  eslintConfigPrettier,

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

      curly: ['error', 'all'],
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
    files: ['src/utils/output.ts'],
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
  }
);
