import { defineConfig, devices } from '@playwright/test';

import { E2E_PORT } from './support/e2e-project';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${E2E_PORT}`,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'bun tests/e2e/support/serve-fixture.ts',
    cwd: '../..',
    url: `http://127.0.0.1:${E2E_PORT}/api/project`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
