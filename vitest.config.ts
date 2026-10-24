import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

const PROJECT_ROOT = fileURLToPath(new URL('./', import.meta.url));
const STORYBOOK_DIR = fileURLToPath(new URL('./.storybook', import.meta.url));

export default defineConfig((env) => {
  return mergeConfig(
    viteConfig(env),
    defineConfig({
      root: PROJECT_ROOT,
      test: {
        projects: [
          {
            extends: true,
            test: {
              name: 'ui-unit',
              environment: 'node',
              include: ['ui/tests/**/*.test.ts'],
            },
          },
          {
            extends: true,
            plugins: [storybookTest({ configDir: STORYBOOK_DIR })],
            test: {
              name: 'storybook',
              browser: {
                enabled: true,
                headless: true,
                provider: playwright(),
                instances: [{ browser: 'chromium' }],
              },
            },
          },
        ],
      },
    })
  );
});
