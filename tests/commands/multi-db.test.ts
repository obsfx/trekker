import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createTestContext, initTrekker, type TestContext } from "../helpers/test-context";
import { existsSync } from "fs";
import { join } from "path";

interface Task {
  id: string;
  title: string;
  status: string;
  epicId: string | null;
}

interface Epic {
  id: string;
  title: string;
  status: string;
}

interface Comment {
  id: string;
  taskId: string;
  content: string;
}

interface Dependency {
  id: string;
  taskId: string;
  dependsOnId: string;
}

interface DependencyItem {
  taskId: string;
  dependsOnId: string;
}

interface DependencyList {
  taskId: string;
  dependsOn: DependencyItem[];
  blocks: DependencyItem[];
}

interface SearchResponse {
  total: number;
  results: Array<{ id: string }>;
}

interface ListResponse {
  total: number;
  items: Array<{ id: string; type: string }>;
}

interface HistoryResponse {
  events: Array<{
    entityId: string;
    action: string;
    entityType: string;
  }>;
}

describe("multi-db", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("init multiple DBs", () => {
    it("should init default and named databases", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      expect(existsSync(join(ctx.cwd, ".trekker", "trekker.db"))).toBe(true);
      expect(existsSync(join(ctx.cwd, ".trekker", "agent2.db"))).toBe(true);
    });

    it("should not error when initing a second DB while first exists", () => {
      initTrekker(ctx);
      // Should not throw
      initTrekker(ctx, "agent2");
    });

    it("should error when initing same DB twice", () => {
      initTrekker(ctx);
      const error = ctx.runExpectError("init");
      expect(error.toLowerCase()).toContain("already initialized");
    });
  });

  describe("create in specific DB", () => {
    it("should create tasks with DB-prefixed IDs", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      const task1 = ctx.runToon<Task>('task create -t "Default task"');
      const task2 = ctx.runToon<Task>('task create -t "Agent2 task" db:agent2');

      expect(task1.id).toMatch(/^TREKKER-TREK-\d+$/);
      expect(task2.id).toMatch(/^AGENT2-TREK-\d+$/);
    });

    it("should create epics with DB-prefixed IDs", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      const epic1 = ctx.runToon<Epic>('epic create -t "Default epic"');
      const epic2 = ctx.runToon<Epic>('epic create -t "Agent2 epic" db:agent2');

      expect(epic1.id).toMatch(/^TREKKER-EPIC-\d+$/);
      expect(epic2.id).toMatch(/^AGENT2-EPIC-\d+$/);
    });
  });

  describe("cross-DB task show", () => {
    it("should show task from another DB by ID without specifying db", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      const task = ctx.runToon<Task>('task create -t "Agent2 task" db:agent2');
      const shown = ctx.runToon<Task>(`task show ${task.id}`);

      expect(shown.id).toBe(task.id);
      expect(shown.title).toBe("Agent2 task");
    });
  });

  describe("aggregated list", () => {
    it("should list tasks from all DBs when no db specified", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      ctx.run('task create -t "Default task 1"');
      ctx.run('task create -t "Default task 2"');
      ctx.run('task create -t "Agent2 task 1" db:agent2');

      const tasks = ctx.runToon<Task[]>("task list");
      expect(tasks).toHaveLength(3);
    });

    it("should list tasks from only specified DB", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      ctx.run('task create -t "Default task"');
      ctx.run('task create -t "Agent2 task" db:agent2');

      const agent2Tasks = ctx.runToon<Task[]>("task list db:agent2");
      expect(agent2Tasks).toHaveLength(1);
      expect(agent2Tasks[0].title).toBe("Agent2 task");
    });

    it("should list epics from all DBs when no db specified", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      ctx.run('epic create -t "Default epic"');
      ctx.run('epic create -t "Agent2 epic" db:agent2');

      const epics = ctx.runToon<Epic[]>("epic list");
      expect(epics).toHaveLength(2);
    });
  });

  describe("cross-DB dependencies", () => {
    it("should add dependency between tasks in different DBs", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      const task1 = ctx.runToon<Task>('task create -t "Default task"');
      const task2 = ctx.runToon<Task>('task create -t "Agent2 task" db:agent2');

      const dep = ctx.runToon<Dependency>(`dep add ${task2.id} ${task1.id}`);
      expect(dep.taskId).toBe(task2.id);
      expect(dep.dependsOnId).toBe(task1.id);
    });

    it("should detect cycles across DBs", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      const task1 = ctx.runToon<Task>('task create -t "Default task"');
      const task2 = ctx.runToon<Task>('task create -t "Agent2 task" db:agent2');

      ctx.run(`dep add ${task2.id} ${task1.id}`); // task2 depends on task1
      const error = ctx.runExpectError(`dep add ${task1.id} ${task2.id}`); // task1 depends on task2 - circular!
      expect(error.toLowerCase()).toContain("cycle");
    });

    it("should detect cycles in longer cross-DB chains", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");
      initTrekker(ctx, "agent3");

      const task1 = ctx.runToon<Task>('task create -t "Task 1"');
      const task2 = ctx.runToon<Task>('task create -t "Task 2" db:agent2');
      const task3 = ctx.runToon<Task>('task create -t "Task 3" db:agent3');

      ctx.run(`dep add ${task2.id} ${task1.id}`); // task2 depends on task1
      ctx.run(`dep add ${task3.id} ${task2.id}`); // task3 depends on task2
      const error = ctx.runExpectError(`dep add ${task1.id} ${task3.id}`); // task1 depends on task3 - circular!
      expect(error.toLowerCase()).toContain("cycle");
    });
  });

  describe("cross-DB dep list", () => {
    it("should show blocks from other DBs", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      const task1 = ctx.runToon<Task>('task create -t "Blocker task"');
      const task2 = ctx.runToon<Task>('task create -t "Agent2 dependent" db:agent2');

      ctx.run(`dep add ${task2.id} ${task1.id}`);

      const deps = ctx.runToon<DependencyList>(`dep list ${task1.id}`);
      expect(deps.blocks).toHaveLength(1);
      expect(deps.blocks[0].taskId).toBe(task2.id);
    });

    it("should show dependsOn from other DBs", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      const task1 = ctx.runToon<Task>('task create -t "Default task"');
      const task2 = ctx.runToon<Task>('task create -t "Agent2 dependent" db:agent2');

      ctx.run(`dep add ${task2.id} ${task1.id}`);

      const deps = ctx.runToon<DependencyList>(`dep list ${task2.id}`);
      expect(deps.dependsOn).toHaveLength(1);
      expect(deps.dependsOn[0].dependsOnId).toBe(task1.id);
    });
  });

  describe("aggregated search", () => {
    it("should find results from all DBs", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      ctx.run('task create -t "Authentication in default"');
      ctx.run('task create -t "Authentication in agent2" db:agent2');

      const result = ctx.runToon<SearchResponse>("search authentication");
      expect(result.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe("aggregated list command", () => {
    it("should aggregate items from all DBs in unified list", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      ctx.run('task create -t "Default task"');
      ctx.run('epic create -t "Default epic"');
      ctx.run('task create -t "Agent2 task" db:agent2');

      const result = ctx.runToon<ListResponse>("list");
      expect(result.total).toBe(3); // 1 task + 1 epic + 1 task from agent2
    });
  });

  describe("aggregated history", () => {
    it("should show events from all DBs", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      ctx.run('task create -t "Default task"');
      ctx.run('task create -t "Agent2 task" db:agent2');

      const history = ctx.runToon<HistoryResponse>("history");
      // Should have at least 2 create events (one from each DB)
      const createEvents = history.events.filter(e => e.action === "create");
      expect(createEvents.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("scoped wipe", () => {
    it("should only delete specified DB", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      ctx.run('task create -t "Default task"');
      ctx.run('task create -t "Agent2 task" db:agent2');

      ctx.run("wipe db:agent2 -y");

      // Default DB should still work
      const tasks = ctx.runToon<Task[]>("task list");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Default task");

      // agent2 DB should be gone
      expect(existsSync(join(ctx.cwd, ".trekker", "agent2.db"))).toBe(false);
      expect(existsSync(join(ctx.cwd, ".trekker", "trekker.db"))).toBe(true);
    });
  });

  describe("comment on cross-DB task", () => {
    it("should store comment in the task's DB", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      const task = ctx.runToon<Task>('task create -t "Agent2 task" db:agent2');
      const comment = ctx.runToon<Comment>(`comment add ${task.id} -a "tester" -c "Cross-DB comment"`);

      expect(comment.id).toMatch(/^AGENT2-CMT-\d+$/);
      expect(comment.taskId).toBe(task.id);

      // Should be listable without db flag (resolves from task ID)
      const comments = ctx.runToon<Comment[]>(`comment list ${task.id}`);
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe("Cross-DB comment");
    });
  });

  describe("cross-DB delete cleanup", () => {
    it("should remove cross-DB dependency references when task is deleted", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      const task1 = ctx.runToon<Task>('task create -t "Default task"');
      const task2 = ctx.runToon<Task>('task create -t "Agent2 task" db:agent2');

      ctx.run(`dep add ${task2.id} ${task1.id}`);

      // Verify dependency exists
      const depsBefore = ctx.runToon<DependencyList>(`dep list ${task2.id}`);
      expect(depsBefore.dependsOn).toHaveLength(1);

      // Delete the depended-on task
      ctx.run(`task delete ${task1.id}`);

      // Dependency should be cleaned up from agent2 DB
      const depsAfter = ctx.runToon<DependencyList>(`dep list ${task2.id}`);
      expect(depsAfter.dependsOn).toHaveLength(0);
    });

    it("should remove cross-DB blocker references when dependent task is deleted", () => {
      initTrekker(ctx);
      initTrekker(ctx, "agent2");

      const task1 = ctx.runToon<Task>('task create -t "Default task"');
      const task2 = ctx.runToon<Task>('task create -t "Agent2 task" db:agent2');

      ctx.run(`dep add ${task2.id} ${task1.id}`);

      // Verify blocker exists
      const depsBefore = ctx.runToon<DependencyList>(`dep list ${task1.id}`);
      expect(depsBefore.blocks).toHaveLength(1);

      // Delete the dependent task
      ctx.run(`task delete ${task2.id} db:agent2`);

      // Blocker reference should be gone
      const depsAfter = ctx.runToon<DependencyList>(`dep list ${task1.id}`);
      expect(depsAfter.blocks).toHaveLength(0);
    });
  });
});
