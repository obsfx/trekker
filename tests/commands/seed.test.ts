import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestContext, initTrekker, type TestContext } from "../helpers/test-context";

interface Epic {
  id: string;
  title: string;
}

interface Task {
  id: string;
  title: string;
}

interface ListResponse {
  total: number;
  items: Array<{ id: string; type: string }>;
}

describe("seed command", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  it("should fail if trekker is not initialized", () => {
    const error = ctx.runExpectError("seed --force");
    expect(error.toLowerCase()).toContain("not initialized");
  });

  it("should create sample data with --force flag", () => {
    initTrekker(ctx);
    const output = ctx.run("seed --force");

    expect(output.toLowerCase()).toContain("seed complete");
    expect(output).toContain("epics");
    expect(output).toContain("tasks");
    expect(output).toContain("subtasks");
    expect(output).toContain("dependencies");
  });

  it("should create epics", () => {
    initTrekker(ctx);
    ctx.run("seed --force");

    const epics = ctx.runToon<Epic[]>("epic list");
    expect(epics.length).toBeGreaterThan(0);
  });

  it("should create tasks", () => {
    initTrekker(ctx);
    ctx.run("seed --force");

    const result = ctx.runToon<ListResponse>("list --type task");
    expect(result.total).toBeGreaterThan(0);
  });

  it("should create subtasks", () => {
    initTrekker(ctx);
    ctx.run("seed --force");

    const result = ctx.runToon<ListResponse>("list --type subtask");
    expect(result.total).toBeGreaterThan(0);
  });

  it("should create dependencies", () => {
    initTrekker(ctx);
    ctx.run("seed --force");

    // Get any task and check if it has dependencies
    const result = ctx.runToon<ListResponse>("list --type task");
    expect(result.items.length).toBeGreaterThan(0);

    // At least some tasks should have dependencies
    let foundDep = false;
    for (const item of result.items.slice(0, 5)) {
      const deps = ctx.runToon<{ dependsOn: Task[]; blocks: Task[] }>(`dep list ${item.id}`);
      if (deps.dependsOn.length > 0 || deps.blocks.length > 0) {
        foundDep = true;
        break;
      }
    }
    expect(foundDep).toBe(true);
  });

  it("should create tasks with various statuses", () => {
    initTrekker(ctx);
    ctx.run("seed --force");

    const todoTasks = ctx.runToon<ListResponse>("list --type task --status todo");
    const inProgressTasks = ctx.runToon<ListResponse>("list --type task --status in_progress");
    const completedTasks = ctx.runToon<ListResponse>("list --type task --status completed");

    expect(todoTasks.total).toBeGreaterThan(0);
    expect(inProgressTasks.total).toBeGreaterThan(0);
    expect(completedTasks.total).toBeGreaterThan(0);
  });

  it("should create tasks with various priorities", () => {
    initTrekker(ctx);
    ctx.run("seed --force");

    const result = ctx.runToon<{ items: Array<{ priority: number }> }>("list --type task");
    const priorities = new Set(result.items.map(i => i.priority));

    // Should have at least 2 different priority levels
    expect(priorities.size).toBeGreaterThanOrEqual(2);
  });
});
