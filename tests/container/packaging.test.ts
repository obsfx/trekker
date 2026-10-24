import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createTestContext, initTrekker, type TestContext } from '../helpers/test-context';
import { TestTarget } from '../helpers/workspace';
import pkg from '../../package.json';

const INSTALL_DIR = '/usr/local/lib/node_modules/@obsfx/trekker';
const PATH_WITHOUT_BUN = '/usr/local/bin:/usr/bin:/bin';
const TOP_LEVEL_COMMANDS = [
  'init',
  'wipe',
  'epic',
  'task',
  'subtask',
  'comment',
  'dep',
  'quickstart',
  'seed',
  'search',
  'history',
  'list',
  'ready',
  'config',
];

describe.skipIf(!TestTarget.isContainer)('packaged release', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.cleanup();
  });

  it('reports the package.json version', () => {
    expect(ctx.run('--version')).toBe(pkg.version);
  });

  it('lists every top-level command in help', () => {
    const help = ctx.run('--help');
    for (const command of TOP_LEVEL_COMMANDS) {
      expect(help).toMatch(new RegExp(`^\\s+${command}\\b`, 'm'));
    }
  });

  it('ships only the published files', () => {
    const listing = ctx.workspace.exec(['ls', INSTALL_DIR]).stdout.split('\n').sort();
    expect(listing).toEqual([
      'LICENSE',
      'README.md',
      'bin',
      'dist',
      'node_modules',
      'package.json',
    ]);
  });

  it('ships a self-contained dist bundle', () => {
    expect(ctx.workspace.exec(['test', '-f', `${INSTALL_DIR}/dist/index.js`]).status).toBe(0);
    expect(ctx.workspace.exec(['test', '-e', `${INSTALL_DIR}/src`]).status).not.toBe(0);
  });

  it('re-executes under bun when launched through node', () => {
    const result = ctx.workspace.exec(['sh', '-c', 'node "$(command -v trekker)" --version']);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(pkg.version);
  });

  it('explains how to install bun when bun is missing', () => {
    const result = ctx.workspace.exec(['trekker', '--version'], {
      env: { PATH: PATH_WITHOUT_BUN },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Trekker requires Bun runtime');
    expect(result.stderr).toContain('curl -fsSL https://bun.sh/install | bash');
  });

  it('runs a full workflow from the installed binary', () => {
    initTrekker(ctx);
    const epic = ctx.runToon<{ id: string }>('epic create -t "Release"');
    const task = ctx.runToon<{ id: string }>(`task create -t "Ship it" -e ${epic.id}`);
    ctx.run(`task update ${task.id} -s completed`);

    const ready = ctx.runToon<{ total: number }>('ready');
    expect(ready.total).toBe(0);
    expect(ctx.query('SELECT status FROM tasks')).toEqual([{ status: 'completed' }]);
  });
});
