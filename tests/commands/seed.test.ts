import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { type TestContext, TestContexts } from '@/tests/helpers/test-context';

interface TypedEntity {
  id: string;
  type: string;
}

interface TaskDependencies {
  dependsOn: Task[];
  blocks: Task[];
}

interface Prioritized {
  priority: number;
}

interface PrioritizedPage {
  items: Prioritized[];
}

interface Epic {
  id: string;
  title: string;
}

interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  items: T[];
}

interface Task {
  id: string;
  title: string;
}

interface ListResponse {
  total: number;
  items: TypedEntity[];
}

describe('seed command', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = TestContexts.createTestContext();
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  it('should fail if trekker is not initialized', () => {
    const error = ctx.runExpectError('seed --force');
    expect(error.toLowerCase()).toContain('not initialized');
  });

  it('should create sample data with --force flag', () => {
    TestContexts.initTrekker(ctx);
    const output = ctx.run('seed --force');

    expect(output.toLowerCase()).toContain('seed complete');
    expect(output).toContain('epics');
    expect(output).toContain('tasks');
    expect(output).toContain('subtasks');
    expect(output).toContain('dependencies');
  });

  it('should create epics', () => {
    TestContexts.initTrekker(ctx);
    ctx.run('seed --force');

    const result = ctx.runToon<PaginatedResponse<Epic>>('epic list');
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('should create tasks', () => {
    TestContexts.initTrekker(ctx);
    ctx.run('seed --force');

    const result = ctx.runToon<ListResponse>('list --type task');
    expect(result.total).toBeGreaterThan(0);
  });

  it('should create subtasks', () => {
    TestContexts.initTrekker(ctx);
    ctx.run('seed --force');

    const result = ctx.runToon<ListResponse>('list --type subtask');
    expect(result.total).toBeGreaterThan(0);
  });

  it('should create dependencies', () => {
    TestContexts.initTrekker(ctx);
    ctx.run('seed --force');

    // Get any task and check if it has dependencies
    const result = ctx.runToon<ListResponse>('list --type task');
    expect(result.items.length).toBeGreaterThan(0);

    // At least some tasks should have dependencies
    let foundDep = false;
    for (const item of result.items.slice(0, 5)) {
      const deps = ctx.runToon<TaskDependencies>(`dep list ${item.id}`);
      if (deps.dependsOn.length > 0 || deps.blocks.length > 0) {
        foundDep = true;
        break;
      }
    }
    expect(foundDep).toBe(true);
  });

  it('should create tasks with various statuses', () => {
    TestContexts.initTrekker(ctx);
    ctx.run('seed --force');

    const todoTasks = ctx.runToon<ListResponse>('list --type task --status todo');
    const inProgressTasks = ctx.runToon<ListResponse>('list --type task --status in_progress');
    const completedTasks = ctx.runToon<ListResponse>('list --type task --status completed');

    expect(todoTasks.total).toBeGreaterThan(0);
    expect(inProgressTasks.total).toBeGreaterThan(0);
    expect(completedTasks.total).toBeGreaterThan(0);
  });

  it('should create tasks with various priorities', () => {
    TestContexts.initTrekker(ctx);
    ctx.run('seed --force');

    const result = ctx.runToon<PrioritizedPage>('list --type task');
    const priorities = new Set(
      result.items.map((i) => {
        return i.priority;
      })
    );

    // Should have at least 2 different priority levels
    expect(priorities.size).toBeGreaterThanOrEqual(2);
  });
});
