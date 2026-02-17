import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createTestContext, initTrekker, type TestContext } from "../helpers/test-context";

interface Task {
  id: string;
  title: string;
}

interface Dependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  createdAt: string;
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

describe("dep command", () => {
  let ctx: TestContext;
  let task1: Task;
  let task2: Task;
  let task3: Task;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
    task1 = ctx.runToon<Task>('task create -t "Task 1"');
    task2 = ctx.runToon<Task>('task create -t "Task 2"');
    task3 = ctx.runToon<Task>('task create -t "Task 3"');
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("add", () => {
    it("should add a dependency between tasks", () => {
      const dep = ctx.runToon<Dependency>(`dep add ${task2.id} ${task1.id}`);

      expect(dep.taskId).toBe(task2.id);
      expect(dep.dependsOnId).toBe(task1.id);
    });

    it("should allow multiple dependencies on a task", () => {
      ctx.run(`dep add ${task3.id} ${task1.id}`);
      ctx.run(`dep add ${task3.id} ${task2.id}`);

      const deps = ctx.runToon<DependencyList>(`dep list ${task3.id}`);
      expect(deps.dependsOn).toHaveLength(2);
    });

    it("should fail when task depends on itself", () => {
      const error = ctx.runExpectError(`dep add ${task1.id} ${task1.id}`);
      expect(error.toLowerCase()).toMatch(/cannot depend on itself|circular|self/);
    });

    it("should fail with circular dependency", () => {
      ctx.run(`dep add ${task2.id} ${task1.id}`); // task2 depends on task1
      const error = ctx.runExpectError(`dep add ${task1.id} ${task2.id}`); // task1 depends on task2 - circular!
      expect(error.toLowerCase()).toContain("cycle");
    });

    it("should fail with longer circular dependency chain", () => {
      ctx.run(`dep add ${task2.id} ${task1.id}`); // task2 depends on task1
      ctx.run(`dep add ${task3.id} ${task2.id}`); // task3 depends on task2
      const error = ctx.runExpectError(`dep add ${task1.id} ${task3.id}`); // task1 depends on task3 - circular!
      expect(error.toLowerCase()).toContain("cycle");
    });

    it("should fail with non-existent task", () => {
      const error = ctx.runExpectError(`dep add TREKKER-TREK-999 ${task1.id}`);
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should fail with non-existent dependency task", () => {
      const error = ctx.runExpectError(`dep add ${task1.id} TREKKER-TREK-999`);
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should fail when dependency already exists", () => {
      ctx.run(`dep add ${task2.id} ${task1.id}`);
      const error = ctx.runExpectError(`dep add ${task2.id} ${task1.id}`);
      expect(error.toLowerCase()).toMatch(/already exists|duplicate/);
    });
  });

  describe("remove", () => {
    it("should remove a dependency", () => {
      ctx.run(`dep add ${task2.id} ${task1.id}`);
      const output = ctx.run(`dep remove ${task2.id} ${task1.id}`);

      expect(output.toLowerCase()).toContain("removed");

      const deps = ctx.runToon<DependencyList>(`dep list ${task2.id}`);
      expect(deps.dependsOn).toHaveLength(0);
    });

    it("should fail when dependency does not exist", () => {
      const error = ctx.runExpectError(`dep remove ${task2.id} ${task1.id}`);
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should only remove specified dependency", () => {
      ctx.run(`dep add ${task3.id} ${task1.id}`);
      ctx.run(`dep add ${task3.id} ${task2.id}`);

      ctx.run(`dep remove ${task3.id} ${task1.id}`);

      const deps = ctx.runToon<DependencyList>(`dep list ${task3.id}`);
      expect(deps.dependsOn).toHaveLength(1);
      expect(deps.dependsOn[0].dependsOnId).toBe(task2.id);
    });
  });

  describe("list", () => {
    it("should list dependencies and blockers", () => {
      ctx.run(`dep add ${task2.id} ${task1.id}`); // task2 depends on task1
      ctx.run(`dep add ${task3.id} ${task2.id}`); // task3 depends on task2

      const deps2 = ctx.runToon<DependencyList>(`dep list ${task2.id}`);
      expect(deps2.dependsOn).toHaveLength(1);
      expect(deps2.dependsOn[0].dependsOnId).toBe(task1.id);
      expect(deps2.blocks).toHaveLength(1);
      expect(deps2.blocks[0].taskId).toBe(task3.id);
    });

    it("should return empty arrays when no dependencies", () => {
      const deps = ctx.runToon<DependencyList>(`dep list ${task1.id}`);
      expect(deps.dependsOn).toHaveLength(0);
      expect(deps.blocks).toHaveLength(0);
    });

    it("should show multiple dependencies", () => {
      ctx.run(`dep add ${task3.id} ${task1.id}`);
      ctx.run(`dep add ${task3.id} ${task2.id}`);

      const deps = ctx.runToon<DependencyList>(`dep list ${task3.id}`);
      expect(deps.dependsOn).toHaveLength(2);
    });

    it("should show multiple blockers", () => {
      ctx.run(`dep add ${task2.id} ${task1.id}`);
      ctx.run(`dep add ${task3.id} ${task1.id}`);

      const deps = ctx.runToon<DependencyList>(`dep list ${task1.id}`);
      expect(deps.blocks).toHaveLength(2);
    });
  });
});
