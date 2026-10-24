import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createTestContext, initTrekker, type TestContext } from '../helpers/test-context';

interface Entity {
  id: string;
}

describe('data integrity on delete', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx.cleanup();
  });

  function create(args: string): string {
    return ctx.runToon<Entity>(args).id;
  }

  it('removes subtasks, comments and dependencies of a deleted task', () => {
    const task = create('task create -t "Parent"');
    const other = create('task create -t "Other"');
    const subtask = create(`subtask create ${task} -t "Child"`);
    create(`comment add ${task} -a tester -c "On parent"`);
    create(`comment add ${subtask} -a tester -c "On child"`);
    ctx.run(`dep add ${other} ${task}`);
    ctx.run(`dep add ${subtask} ${other}`);

    ctx.run(`task delete ${task}`);

    expect(ctx.query('SELECT id FROM tasks')).toEqual([{ id: other }]);
    expect(ctx.query('SELECT id FROM comments')).toEqual([]);
    expect(ctx.query('SELECT task_id FROM dependencies')).toEqual([]);
  });

  it('unblocks dependents when their blocker is deleted', () => {
    const blocker = create('task create -t "Blocker"');
    const blocked = create('task create -t "Blocked"');
    ctx.run(`dep add ${blocked} ${blocker}`);

    ctx.run(`task delete ${blocker}`);

    const ready = ctx.runToon<{ items: Entity[] }>('ready');
    expect(ready.items.map((item) => item.id)).toEqual([blocked]);
  });

  it('detaches tasks and subtasks from a deleted epic', () => {
    const epic = create('epic create -t "Epic"');
    const task = create(`task create -t "Task" -e ${epic}`);
    create(`subtask create ${task} -t "Child"`);

    ctx.run(`epic delete ${epic}`);

    expect(ctx.query('SELECT COUNT(*) AS count FROM tasks')).toEqual([{ count: 2 }]);
    expect(ctx.query('SELECT COUNT(*) AS count FROM tasks WHERE epic_id IS NOT NULL')).toEqual([
      { count: 0 },
    ]);
  });

  it('removes comments and dependencies of a deleted subtask', () => {
    const task = create('task create -t "Parent"');
    const subtask = create(`subtask create ${task} -t "Child"`);
    create(`comment add ${subtask} -a tester -c "On child"`);
    ctx.run(`dep add ${subtask} ${task}`);

    ctx.run(`subtask delete ${subtask}`);

    expect(ctx.query('SELECT id FROM tasks')).toEqual([{ id: task }]);
    expect(ctx.query('SELECT COUNT(*) AS count FROM comments')).toEqual([{ count: 0 }]);
    expect(ctx.query('SELECT COUNT(*) AS count FROM dependencies')).toEqual([{ count: 0 }]);
  });

  it('records history for every cascaded delete', () => {
    const task = create('task create -t "Parent"');
    const subtask = create(`subtask create ${task} -t "Child"`);
    const comment = create(`comment add ${task} -a tester -c "Note"`);

    ctx.run(`task delete ${task}`);

    const deleted = ctx
      .query("SELECT entity_id FROM events WHERE action = 'delete'")
      .map((row) => row.entity_id);
    expect(deleted).toEqual(expect.arrayContaining([task, subtask, comment]));
  });

  it('keeps no orphaned rows after mixed deletes', () => {
    const epic = create('epic create -t "Epic"');
    const tasks = [1, 2, 3].map((index) => create(`task create -t "Task ${index}" -e ${epic}`));
    for (const task of tasks) {
      create(`subtask create ${task} -t "Child of ${task}"`);
      create(`comment add ${task} -a tester -c "Note"`);
    }
    ctx.run(`dep add ${tasks[1]} ${tasks[0]}`);
    ctx.run(`dep add ${tasks[2]} ${tasks[1]}`);

    ctx.run(`task delete ${tasks[1]}`);
    ctx.run(`epic delete ${epic}`);

    expect(ctx.query('PRAGMA foreign_key_check')).toEqual([]);
    expect(
      ctx.query(
        'SELECT id FROM tasks WHERE parent_task_id IS NOT NULL AND parent_task_id NOT IN (SELECT id FROM tasks)'
      )
    ).toEqual([]);
  });
});
