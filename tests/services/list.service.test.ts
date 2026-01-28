import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServiceContext, initTrekkerService, type ServiceContext } from "../helpers/service-context";

describe("list service (in-process)", () => {
  let ctx: ServiceContext;

  beforeEach(async () => {
    ctx = createServiceContext();
    await initTrekkerService(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("listAll", () => {
    it("should list all entities", async () => {
      await ctx.createEpic({ title: "Epic 1" });
      await ctx.createTask({ title: "Task 1" });
      await ctx.createTask({ title: "Task 2" });

      const results = await ctx.listAll();
      expect(results.items.length).toBeGreaterThanOrEqual(3);
    });

    it("should return empty when no entities", async () => {
      const results = await ctx.listAll();
      expect(results.items).toHaveLength(0);
    });

    it("should filter by type", async () => {
      await ctx.createEpic({ title: "Epic 1" });
      await ctx.createTask({ title: "Task 1" });

      const taskResults = await ctx.listAll({ types: ["task"] });
      expect(taskResults.items.every((i) => i.type === "task")).toBe(true);

      const epicResults = await ctx.listAll({ types: ["epic"] });
      expect(epicResults.items.every((i) => i.type === "epic")).toBe(true);
    });

    it("should filter by statuses", async () => {
      await ctx.createTask({ title: "Todo Task", status: "todo" });
      await ctx.createTask({ title: "In Progress Task", status: "in_progress" });
      await ctx.createTask({ title: "Completed Task", status: "completed" });

      const todoResults = await ctx.listAll({ statuses: ["todo"] });
      expect(todoResults.items.every((i) => i.status === "todo")).toBe(true);
    });

    it("should filter by multiple statuses", async () => {
      await ctx.createTask({ title: "Todo Task", status: "todo" });
      await ctx.createTask({ title: "In Progress Task", status: "in_progress" });
      await ctx.createTask({ title: "Completed Task", status: "completed" });

      const results = await ctx.listAll({ statuses: ["todo", "in_progress"], types: ["task"] });
      expect(results.items).toHaveLength(2);
    });

    it("should filter subtasks correctly", async () => {
      const parent = await ctx.createTask({ title: "Parent Task" });
      await ctx.createSubtask(parent.id, { title: "Subtask 1" });
      await ctx.createSubtask(parent.id, { title: "Subtask 2" });

      // Only subtasks
      const subtaskResults = await ctx.listAll({ types: ["subtask"] });
      expect(subtaskResults.items).toHaveLength(2);
      expect(subtaskResults.items.every((i) => i.type === "subtask")).toBe(true);

      // Only tasks (no subtasks)
      const taskResults = await ctx.listAll({ types: ["task"] });
      expect(taskResults.items).toHaveLength(1);
      expect(taskResults.items[0].title).toBe("Parent Task");
    });
  });

  describe("pagination", () => {
    it("should respect page and limit", async () => {
      for (let i = 1; i <= 15; i++) {
        await ctx.createTask({ title: `Task ${i}` });
      }

      const page1 = await ctx.listAll({ page: 1, limit: 5 });
      expect(page1.items).toHaveLength(5);
      expect(page1.total).toBe(15);

      const page2 = await ctx.listAll({ page: 2, limit: 5 });
      expect(page2.items).toHaveLength(5);
    });
  });

  describe("sorting", () => {
    it("should sort by priority", async () => {
      await ctx.createTask({ title: "Low priority", priority: 4 });
      await ctx.createTask({ title: "High priority", priority: 1 });
      await ctx.createTask({ title: "Medium priority", priority: 2 });

      const asc = await ctx.listAll({ sort: [{ field: "priority", direction: "asc" }] });
      expect(asc.items[0].title).toBe("High priority");

      const desc = await ctx.listAll({ sort: [{ field: "priority", direction: "desc" }] });
      expect(desc.items[0].title).toBe("Low priority");
    });
  });
});
