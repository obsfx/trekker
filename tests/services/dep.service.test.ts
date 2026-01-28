import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServiceContext, initTrekkerService, type ServiceContext } from "../helpers/service-context";

describe("dependency service (in-process)", () => {
  let ctx: ServiceContext;

  beforeEach(async () => {
    ctx = createServiceContext();
    await initTrekkerService(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("add", () => {
    it("should add a dependency between tasks", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      const task2 = await ctx.createTask({ title: "Task 2" });

      const dep = await ctx.addDependency(task2.id, task1.id);

      expect(dep.taskId).toBe(task2.id);
      expect(dep.dependsOnId).toBe(task1.id);
    });

    it("should fail for non-existent task", async () => {
      const task = await ctx.createTask({ title: "Task" });

      await expect(ctx.addDependency("TREK-999", task.id))
        .rejects.toThrow(/not found/i);
    });

    it("should fail for non-existent depends-on task", async () => {
      const task = await ctx.createTask({ title: "Task" });

      await expect(ctx.addDependency(task.id, "TREK-999"))
        .rejects.toThrow(/not found/i);
    });

    it("should fail for self-dependency", async () => {
      const task = await ctx.createTask({ title: "Task" });

      await expect(ctx.addDependency(task.id, task.id))
        .rejects.toThrow(/itself/i);
    });

    it("should fail for duplicate dependency", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      const task2 = await ctx.createTask({ title: "Task 2" });

      await ctx.addDependency(task2.id, task1.id);

      await expect(ctx.addDependency(task2.id, task1.id))
        .rejects.toThrow(/already exists/i);
    });

    it("should fail for circular dependency", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      const task2 = await ctx.createTask({ title: "Task 2" });

      await ctx.addDependency(task2.id, task1.id); // task2 depends on task1

      await expect(ctx.addDependency(task1.id, task2.id))
        .rejects.toThrow(/cycle/i);
    });

    it("should detect transitive circular dependency", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      const task2 = await ctx.createTask({ title: "Task 2" });
      const task3 = await ctx.createTask({ title: "Task 3" });

      await ctx.addDependency(task2.id, task1.id); // task2 depends on task1
      await ctx.addDependency(task3.id, task2.id); // task3 depends on task2

      await expect(ctx.addDependency(task1.id, task3.id))
        .rejects.toThrow(/cycle/i);
    });
  });

  describe("remove", () => {
    it("should remove a dependency", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      const task2 = await ctx.createTask({ title: "Task 2" });

      await ctx.addDependency(task2.id, task1.id);
      await ctx.removeDependency(task2.id, task1.id);

      const deps = await ctx.getDependencies(task2.id);
      expect(deps.dependsOn).toHaveLength(0);
    });

    it("should fail for non-existent dependency", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      const task2 = await ctx.createTask({ title: "Task 2" });

      await expect(ctx.removeDependency(task2.id, task1.id))
        .rejects.toThrow(/not found/i);
    });
  });

  describe("list", () => {
    it("should list dependencies for a task", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      const task2 = await ctx.createTask({ title: "Task 2" });
      const task3 = await ctx.createTask({ title: "Task 3" });

      await ctx.addDependency(task3.id, task1.id); // task3 depends on task1
      await ctx.addDependency(task3.id, task2.id); // task3 depends on task2

      const deps = await ctx.getDependencies(task3.id);
      expect(deps.dependsOn).toHaveLength(2);
    });

    it("should list blocked-by for a task", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      const task2 = await ctx.createTask({ title: "Task 2" });
      const task3 = await ctx.createTask({ title: "Task 3" });

      await ctx.addDependency(task2.id, task1.id); // task2 depends on task1
      await ctx.addDependency(task3.id, task1.id); // task3 depends on task1

      const deps = await ctx.getDependencies(task1.id);
      expect(deps.blocks).toHaveLength(2);
    });

    it("should return empty arrays when no dependencies", async () => {
      const task = await ctx.createTask({ title: "Task" });

      const deps = await ctx.getDependencies(task.id);
      expect(deps.dependsOn).toHaveLength(0);
      expect(deps.blocks).toHaveLength(0);
    });
  });
});
