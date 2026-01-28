import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServiceContext, initTrekkerService, type ServiceContext } from "../helpers/service-context";

describe("search service (in-process)", () => {
  let ctx: ServiceContext;

  beforeEach(async () => {
    ctx = createServiceContext();
    await initTrekkerService(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("keyword search", () => {
    it("should search tasks by title", async () => {
      await ctx.createTask({ title: "Authentication feature" });
      await ctx.createTask({ title: "Database migration" });
      await ctx.createTask({ title: "Auth bug fix" });

      // FTS5 uses MATCH which does exact word matching
      const results = await ctx.search("authentication");
      expect(results.results.length).toBeGreaterThanOrEqual(1);
    });

    it("should search tasks by description", async () => {
      await ctx.createTask({ title: "Task 1", description: "Implement user login" });
      await ctx.createTask({ title: "Task 2", description: "Add logout button" });

      const results = await ctx.search("login");
      expect(results.results.length).toBeGreaterThanOrEqual(1);
    });

    it("should search epics", async () => {
      await ctx.createEpic({ title: "Authentication Epic" });
      await ctx.createEpic({ title: "Database Epic" });

      // FTS5 MATCH for full word
      const results = await ctx.search("authentication");
      expect(results.results.some((r) => r.type === "epic")).toBe(true);
    });

    it("should search comments", async () => {
      const task = await ctx.createTask({ title: "Test Task" });
      await ctx.createComment({ taskId: task.id, author: "user", content: "Need to implement caching" });

      const results = await ctx.search("caching");
      expect(results.results.some((r) => r.type === "comment")).toBe(true);
    });

    it("should return empty results for no matches", async () => {
      await ctx.createTask({ title: "Simple task" });

      const results = await ctx.search("xyznonexistent");
      expect(results.results).toHaveLength(0);
    });
  });

  describe("search with filters", () => {
    it("should filter by entity type", async () => {
      await ctx.createTask({ title: "Auth task" });
      await ctx.createEpic({ title: "Auth epic" });

      const taskResults = await ctx.search("auth", { types: ["task"] });
      expect(taskResults.results.every((r) => r.type === "task")).toBe(true);

      const epicResults = await ctx.search("auth", { types: ["epic"] });
      expect(epicResults.results.every((r) => r.type === "epic")).toBe(true);
    });

    it("should filter by status", async () => {
      await ctx.createTask({ title: "Auth todo", status: "todo" });
      await ctx.createTask({ title: "Auth completed", status: "completed" });

      const results = await ctx.search("auth", { status: "completed" });
      expect(results.results.length).toBeGreaterThanOrEqual(1);
      expect(results.results.every((r) => r.status === "completed")).toBe(true);
    });
  });

  describe("pagination", () => {
    it("should respect page and limit", async () => {
      // Create multiple items
      for (let i = 1; i <= 25; i++) {
        await ctx.createTask({ title: `Test task ${i}` });
      }

      const page1 = await ctx.search("test", { page: 1, limit: 10 });
      expect(page1.results.length).toBe(10);
      expect(page1.total).toBeGreaterThanOrEqual(25);

      const page2 = await ctx.search("test", { page: 2, limit: 10 });
      expect(page2.results.length).toBe(10);
    });
  });
});
