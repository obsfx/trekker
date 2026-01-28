import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServiceContext, initTrekkerService, type ServiceContext } from "../helpers/service-context";

describe("history service (in-process)", () => {
  let ctx: ServiceContext;

  beforeEach(async () => {
    ctx = createServiceContext();
    await initTrekkerService(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("getHistory", () => {
    it("should record task creation", async () => {
      await ctx.createTask({ title: "Test Task" });

      const history = await ctx.getHistory();
      expect(history.events.length).toBeGreaterThanOrEqual(1);
      expect(history.events.some((e) => e.action === "create" && e.entityType === "task")).toBe(true);
    });

    it("should record task updates", async () => {
      const task = await ctx.createTask({ title: "Test Task" });
      await ctx.updateTask(task.id, { status: "in_progress" });

      const history = await ctx.getHistory();
      expect(history.events.some((e) => e.action === "update" && e.entityId === task.id)).toBe(true);
    });

    it("should record task deletion", async () => {
      const task = await ctx.createTask({ title: "Test Task" });
      const taskId = task.id;
      await ctx.deleteTask(taskId);

      const history = await ctx.getHistory();
      expect(history.events.some((e) => e.action === "delete" && e.entityId === taskId)).toBe(true);
    });

    it("should record epic events", async () => {
      const epic = await ctx.createEpic({ title: "Test Epic" });
      await ctx.updateEpic(epic.id, { status: "in_progress" });

      const history = await ctx.getHistory();
      expect(history.events.some((e) => e.action === "create" && e.entityType === "epic")).toBe(true);
      expect(history.events.some((e) => e.action === "update" && e.entityType === "epic")).toBe(true);
    });

    it("should record comment events", async () => {
      const task = await ctx.createTask({ title: "Test Task" });
      await ctx.createComment({ taskId: task.id, author: "user", content: "Comment" });

      const history = await ctx.getHistory();
      expect(history.events.some((e) => e.action === "create" && e.entityType === "comment")).toBe(true);
    });
  });

  describe("filtering", () => {
    it("should filter by entity types", async () => {
      await ctx.createTask({ title: "Task" });
      await ctx.createEpic({ title: "Epic" });

      const taskHistory = await ctx.getHistory({ types: ["task"] });
      expect(taskHistory.events.every((e) => e.entityType === "task")).toBe(true);

      const epicHistory = await ctx.getHistory({ types: ["epic"] });
      expect(epicHistory.events.every((e) => e.entityType === "epic")).toBe(true);
    });

    it("should filter by actions", async () => {
      const task = await ctx.createTask({ title: "Task" });
      await ctx.updateTask(task.id, { title: "Updated" });

      const createHistory = await ctx.getHistory({ actions: ["create"] });
      expect(createHistory.events.every((e) => e.action === "create")).toBe(true);

      const updateHistory = await ctx.getHistory({ actions: ["update"] });
      expect(updateHistory.events.every((e) => e.action === "update")).toBe(true);
    });

    it("should filter by entity ID", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      await ctx.createTask({ title: "Task 2" });
      await ctx.updateTask(task1.id, { status: "in_progress" });

      const history = await ctx.getHistory({ entityId: task1.id });
      expect(history.events.every((e) => e.entityId === task1.id)).toBe(true);
      expect(history.events.length).toBeGreaterThanOrEqual(2); // create + update
    });
  });

  describe("pagination", () => {
    it("should respect page and limit", async () => {
      // Create multiple events
      for (let i = 1; i <= 15; i++) {
        await ctx.createTask({ title: `Task ${i}` });
      }

      const page1 = await ctx.getHistory({ page: 1, limit: 5 });
      expect(page1.events).toHaveLength(5);
      expect(page1.total).toBeGreaterThanOrEqual(15);

      const page2 = await ctx.getHistory({ page: 2, limit: 5 });
      expect(page2.events).toHaveLength(5);
    });
  });
});
