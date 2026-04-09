import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Database } from 'bun:sqlite';
import { createTestContext, type TestContext } from '../helpers/test-context';

interface ConfigMap {
  issue_prefix: string;
  epic_prefix: string;
  comment_prefix: string;
}

interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ConfigValue {
  key: string;
  value: string;
}

interface Task {
  id: string;
}

interface Epic {
  id: string;
}

interface Comment {
  id: string;
}

describe('config command', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  it('seeds default prefixes on init', () => {
    ctx.run('init');

    const config = ctx.runToon<ConfigMap>('config list');

    expect(config).toEqual({
      issue_prefix: 'TREK',
      epic_prefix: 'EPIC',
      comment_prefix: 'CMT',
    });
  });

  it('honors custom init prefix flags', () => {
    ctx.run('init --issue-prefix feat --epic-prefix plan --comment-prefix note');

    const config = ctx.runToon<ConfigMap>('config list');

    expect(config).toEqual({
      issue_prefix: 'FEAT',
      epic_prefix: 'PLAN',
      comment_prefix: 'NOTE',
    });
  });

  it('fails init when prefixes are duplicated and does not initialize the project', () => {
    const error = ctx.runExpectError('init --issue-prefix feat --epic-prefix feat');

    expect(error).toContain('must be unique');
    expect(existsSync(join(ctx.cwd, '.trekker', 'trekker.db'))).toBe(false);
  });

  it('supports get, set, and unset with TOON output', () => {
    ctx.run('init');

    const initial = ctx.runToon<ConfigValue>('config get issue_prefix');
    expect(initial).toEqual({ key: 'issue_prefix', value: 'TREK' });

    const updated = ctx.runToon<SuccessResponse<ConfigValue>>('config set issue_prefix feat');
    expect(updated.success).toBe(true);
    expect(updated.data).toEqual({ key: 'issue_prefix', value: 'FEAT' });

    const afterSet = ctx.runToon<ConfigValue>('config get issue_prefix');
    expect(afterSet).toEqual({ key: 'issue_prefix', value: 'FEAT' });

    const reset = ctx.runToon<SuccessResponse<ConfigValue>>('config unset issue_prefix');
    expect(reset.success).toBe(true);
    expect(reset.data).toEqual({ key: 'issue_prefix', value: 'TREK' });
  });

  it('rejects invalid prefix values and duplicate prefixes', () => {
    ctx.run('init');

    const invalidError = ctx.runExpectError('config set issue_prefix 123abc');
    expect(invalidError).toContain('Invalid prefix value');

    const duplicateError = ctx.runExpectError('config set issue_prefix EPIC');
    expect(duplicateError).toContain('must be unique');
  });

  it('uses configured prefixes for new tasks, subtasks, epics, and comments', () => {
    ctx.run('init --issue-prefix feat --epic-prefix plan --comment-prefix note');

    const epic = ctx.runToon<Epic>('epic create -t "Roadmap"');
    const task = ctx.runToon<Task>(`task create -t "Build feature" -e ${epic.id}`);
    const subtask = ctx.runToon<Task>(`subtask create ${task.id} -t "Ship details"`);
    const comment = ctx.runToon<Comment>(`comment add ${task.id} -a "agent" -c "Tracked"`);

    expect(epic.id).toBe('PLAN-1');
    expect(task.id).toBe('FEAT-1');
    expect(subtask.id).toBe('FEAT-2');
    expect(comment.id).toBe('NOTE-1');
  });

  it('keeps existing IDs unchanged and continues counters after prefix changes', () => {
    ctx.run('init');

    const epic1 = ctx.runToon<Epic>('epic create -t "Default Epic"');
    const task1 = ctx.runToon<Task>('task create -t "Default Task"');
    const comment1 = ctx.runToon<Comment>(`comment add ${task1.id} -a "agent" -c "First"`);

    ctx.run('config set epic_prefix plan');
    ctx.run('config set issue_prefix feat');
    ctx.run('config set comment_prefix note');

    const epic2 = ctx.runToon<Epic>('epic create -t "Configured Epic"');
    const task2 = ctx.runToon<Task>('task create -t "Configured Task"');
    const comment2 = ctx.runToon<Comment>(`comment add ${task1.id} -a "agent" -c "Second"`);

    expect(epic1.id).toBe('EPIC-1');
    expect(task1.id).toBe('TREK-1');
    expect(comment1.id).toBe('CMT-1');
    expect(epic2.id).toBe('PLAN-2');
    expect(task2.id).toBe('FEAT-2');
    expect(comment2.id).toBe('NOTE-2');

    const shownTask = ctx.runToon<Task>(`task show ${task1.id}`);
    expect(shownTask.id).toBe('TREK-1');
  });

  it('migrates databases that are missing the project_config table', () => {
    ctx.run('init');

    const db = new Database(join(ctx.cwd, '.trekker', 'trekker.db'));
    db.run('DROP TABLE project_config');
    db.close();

    const config = ctx.runToon<ConfigMap>('config list');
    expect(config).toEqual({
      issue_prefix: 'TREK',
      epic_prefix: 'EPIC',
      comment_prefix: 'CMT',
    });

    const task = ctx.runToon<Task>('task create -t "Migrated Task"');
    expect(task.id).toBe('TREK-1');
  });
});
