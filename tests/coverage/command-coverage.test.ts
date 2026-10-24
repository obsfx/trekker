import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { type TestContext, TestContexts } from '@/tests/helpers/test-context';
import { type CommandSpec, CommandMatrix } from '@/tests/coverage/command-matrix';

describe('command coverage matrix', () => {
  let ctx: TestContext;
  let commands: CommandSpec[];

  beforeAll(() => {
    ctx = TestContexts.createTestContext();
    commands = CommandMatrix.discoverCommands(ctx).commands;
  });

  afterAll(() => {
    ctx.cleanup();
  });

  it('discovers the registered command tree', () => {
    expect(
      commands.map((command) => {
        return command.path;
      })
    ).toContain('task update');
    expect(commands.length).toBeGreaterThan(30);
  });

  it('has a test invoking every command and every option', () => {
    expect(
      CommandMatrix.uncoveredEntries(commands, CommandMatrix.collectInvocations(commands))
    ).toEqual([]);
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

    expect(CommandMatrix.uncoveredEntries(specs, [['task', 'update', 'X', '-t', 'New']])).toEqual([
      'task update --tags',
      'dep list',
    ]);
  });
});
