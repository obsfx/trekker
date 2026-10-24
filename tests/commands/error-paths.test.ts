import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createTestContext, initTrekker, type TestContext } from '../helpers/test-context';

const COMMANDS_REQUIRING_INIT = [
  'wipe -y',
  'seed --force',
  'epic create -t "Epic"',
  'epic list',
  'epic show EPIC-1',
  'epic update EPIC-1 -t "New"',
  'epic delete EPIC-1',
  'epic complete EPIC-1',
  'task create -t "Task"',
  'task list',
  'task show TREK-1',
  'task update TREK-1 -t "New"',
  'task delete TREK-1',
  'subtask create TREK-1 -t "Subtask"',
  'subtask list TREK-1',
  'subtask update TREK-2 -t "New"',
  'subtask delete TREK-2',
  'comment add TREK-1 -a tester -c "Note"',
  'comment list TREK-1',
  'comment update CMT-1 -c "New"',
  'comment delete CMT-1',
  'dep add TREK-1 TREK-2',
  'dep remove TREK-1 TREK-2',
  'dep list TREK-1',
  'search anything',
  'history',
  'list',
  'ready',
  'config list',
  'config get issue_prefix',
  'config set issue_prefix FEAT',
  'config unset issue_prefix',
];

describe('error paths', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('uninitialized project', () => {
    for (const command of COMMANDS_REQUIRING_INIT) {
      it(`${command} fails with a not initialized error`, () => {
        expect(ctx.runExpectError(command).toLowerCase()).toContain('not initialized');
        expect(ctx.exists('.trekker')).toBe(false);
      });
    }

    it('quickstart works without a project', () => {
      expect(ctx.run('quickstart')).toContain('trekker');
    });
  });

  describe('invalid values', () => {
    beforeEach(() => {
      initTrekker(ctx);
    });

    it('rejects invalid statuses and priorities on create', () => {
      expect(ctx.runExpectError('task create -t "T" -s done')).toContain('Invalid task status');
      expect(ctx.runExpectError('epic create -t "E" -s wont_fix')).toContain('Invalid epic status');
      expect(ctx.runExpectError('task create -t "T" -p 6')).toContain('Invalid priority');
      expect(ctx.runExpectError('task create -t "T" -p -1')).toContain('Invalid priority');
      expect(ctx.runExpectError('epic create -t "E" -p high')).toContain('Invalid priority');
    });

    it('rejects invalid statuses and priorities on update', () => {
      const task = ctx.runToon<{ id: string }>('task create -t "T"').id;
      const subtask = ctx.runToon<{ id: string }>(`subtask create ${task} -t "S"`).id;
      const epic = ctx.runToon<{ id: string }>('epic create -t "E"').id;

      expect(ctx.runExpectError(`task update ${task} -s done`)).toContain('Invalid task status');
      expect(ctx.runExpectError(`subtask update ${subtask} -p 9`)).toContain('Invalid priority');
      expect(ctx.runExpectError(`epic update ${epic} -s wont_fix`)).toContain(
        'Invalid epic status'
      );
    });

    it('rejects references to missing entities', () => {
      expect(ctx.runExpectError('task create -t "T" -e EPIC-404')).toContain('not found');
      expect(ctx.runExpectError('subtask create TREK-404 -t "S"')).toContain('not found');
      expect(ctx.runExpectError('dep add TREK-404 TREK-405')).toContain('not found');
      expect(ctx.runExpectError('task show TREK-404')).toContain('not found');
      expect(ctx.runExpectError('epic show EPIC-404')).toContain('not found');
    });

    it('rejects missing required options', () => {
      expect(ctx.runExpectError('task create')).toContain('--title');
      expect(ctx.runExpectError('epic create')).toContain('--title');
      expect(ctx.runExpectError('comment add TREK-1 -a tester')).toContain('--content');
    });

    it('rejects unknown commands and options', () => {
      expect(ctx.runExpectError('frobnicate')).toContain('unknown command');
      expect(ctx.runExpectError('task list --bogus')).toContain('unknown option');
    });

    it('rejects invalid list filters', () => {
      expect(ctx.runExpectError('list --type story')).toContain('Invalid type');
      expect(ctx.runExpectError('list --priority 7')).toContain('Invalid priority');
      expect(ctx.runExpectError('search x --type story')).toContain('Invalid type');
    });

    it('leaves the database unchanged after failed writes', () => {
      ctx.runExpectError('task create -t "T" -s done');
      ctx.runExpectError('epic create -t "E" -p 9');
      expect(ctx.query('SELECT COUNT(*) AS count FROM tasks')).toEqual([{ count: 0 }]);
      expect(ctx.query('SELECT COUNT(*) AS count FROM epics')).toEqual([{ count: 0 }]);
    });
  });
});
