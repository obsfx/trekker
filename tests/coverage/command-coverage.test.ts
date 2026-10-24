import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createTestContext, type TestContext } from '../helpers/test-context';
import {
  collectInvocations,
  discoverCommands,
  uncoveredEntries,
  type CommandSpec,
} from './command-matrix';

describe('command coverage matrix', () => {
  let ctx: TestContext;
  let commands: CommandSpec[];

  beforeAll(() => {
    ctx = createTestContext();
    commands = discoverCommands(ctx).commands;
  });

  afterAll(() => {
    ctx.cleanup();
  });

  it('discovers the registered command tree', () => {
    expect(commands.map((command) => command.path)).toContain('task update');
    expect(commands.length).toBeGreaterThan(30);
  });

  it('has a test invoking every command and every option', () => {
    expect(uncoveredEntries(commands, collectInvocations(commands))).toEqual([]);
  });

  it('reports commands and options that no test exercises', () => {
    const specs: CommandSpec[] = [
      {
        path: 'task update',
        options: [
          { long: '--title', short: '-t' },
          { long: '--tags', short: null },
        ],
      },
      { path: 'dep list', options: [] },
    ];

    expect(uncoveredEntries(specs, [['task', 'update', 'X', '-t', 'New']])).toEqual([
      'task update --tags',
      'dep list',
    ]);
  });
});
