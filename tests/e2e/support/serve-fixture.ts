import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

import { CLI_ENTRY, E2E_DIR, E2E_PORT, E2eProject } from '@/tests/e2e/support/e2e-project';

export abstract class ServeFixtureHelpers {
  static readonly stop = () => {
    server.kill('SIGTERM');
  };
}

rmSync(E2E_DIR, { recursive: true, force: true });
mkdirSync(E2E_DIR, { recursive: true });
E2eProject.trekker(['init']);
E2eProject.trekker(['epic', 'create', '-t', 'Dashboard rewrite', '-s', 'in_progress']);
E2eProject.trekker(['task', 'create', '-t', 'Seeded todo task', '-e', 'EPIC-1']);
E2eProject.trekker(['task', 'create', '-t', 'Second todo task']);
E2eProject.trekker(['task', 'create', '-t', 'Already done', '-s', 'completed']);

const server = spawn('bun', [CLI_ENTRY, 'serve', '--port', String(E2E_PORT)], {
  cwd: E2E_DIR,
  stdio: 'inherit',
});
process.on('SIGINT', ServeFixtureHelpers.stop);
process.on('SIGTERM', ServeFixtureHelpers.stop);
server.on('exit', (code) => {
  process.exit(code ?? 0);
});
