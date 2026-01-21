import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createTestContext, initTrekker, type TestContext } from "../helpers/test-context";

interface Task {
  id: string;
  title: string;
}

interface Epic {
  id: string;
  title: string;
}

interface HistoryEvent {
  id: number;
  entityType: "epic" | "task" | "subtask" | "comment" | "dependency";
  entityId: string;
  action: "create" | "update" | "delete";
  changes?: Record<string, { from: unknown; to: unknown }>;
  snapshot?: Record<string, unknown>;
  timestamp: string;
}

interface HistoryResponse {
  total: number;
  page: number;
  limit: number;
  events: HistoryEvent[];
}

describe("history command", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("basic history", () => {
    it("should track task creation", () => {
      ctx.run('task create -t "Test Task"');

      const result = ctx.runToon<HistoryResponse>("history");
      expect(result.events.some(e => e.action === "create" && e.entityType === "task")).toBe(true);
    });

    it("should track task updates", () => {
      const task = ctx.runToon<Task>('task create -t "Test Task"');
      ctx.run(`task update ${task.id} -s in_progress`);

      const result = ctx.runToon<HistoryResponse>("history");
      const updateEvent = result.events.find(e => e.action === "update" && e.entityId === task.id);

      expect(updateEvent).toBeDefined();
      expect(updateEvent?.changes?.status?.from).toBe("todo");
      expect(updateEvent?.changes?.status?.to).toBe("in_progress");
    });

    it("should track task deletion", () => {
      const task = ctx.runToon<Task>('task create -t "Test Task"');
      ctx.run(`task delete ${task.id}`);

      const result = ctx.runToon<HistoryResponse>("history");
      expect(result.events.some(e => e.action === "delete" && e.entityId === task.id)).toBe(true);
    });

    it("should track epic operations", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic"');
      ctx.run(`epic update ${epic.id} -s in_progress`);
      ctx.run(`epic delete ${epic.id}`);

      const result = ctx.runToon<HistoryResponse>("history");
      const epicEvents = result.events.filter(e => e.entityId === epic.id);

      expect(epicEvents.some(e => e.action === "create")).toBe(true);
      expect(epicEvents.some(e => e.action === "update")).toBe(true);
      expect(epicEvents.some(e => e.action === "delete")).toBe(true);
    });

    it("should return empty history when no operations", () => {
      const result = ctx.runToon<HistoryResponse>("history");
      expect(result.events).toHaveLength(0);
    });
  });

  describe("entity filter", () => {
    it("should filter by entity ID", () => {
      const task1 = ctx.runToon<Task>('task create -t "Task 1"');
      ctx.run('task create -t "Task 2"');

      const result = ctx.runToon<HistoryResponse>(`history --entity ${task1.id}`);
      expect(result.events.every(e => e.entityId === task1.id)).toBe(true);
    });
  });

  describe("type filter", () => {
    beforeEach(() => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic"');
      const task = ctx.runToon<Task>('task create -t "Test Task"');
      ctx.run(`subtask create ${task.id} -t "Test Subtask"`);
      ctx.run(`comment add ${task.id} -a "agent" -c "Test comment"`);
    });

    it("should filter by epic type", () => {
      const result = ctx.runToon<HistoryResponse>("history --type epic");
      expect(result.events.every(e => e.entityType === "epic")).toBe(true);
    });

    it("should filter by task type", () => {
      const result = ctx.runToon<HistoryResponse>("history --type task");
      expect(result.events.every(e => e.entityType === "task")).toBe(true);
    });

    it("should filter by subtask type", () => {
      const result = ctx.runToon<HistoryResponse>("history --type subtask");
      expect(result.events.every(e => e.entityType === "subtask")).toBe(true);
    });

    it("should filter by comment type", () => {
      const result = ctx.runToon<HistoryResponse>("history --type comment");
      expect(result.events.every(e => e.entityType === "comment")).toBe(true);
    });

    it("should filter by multiple types", () => {
      const result = ctx.runToon<HistoryResponse>("history --type epic,task");
      expect(result.events.every(e => e.entityType === "epic" || e.entityType === "task")).toBe(true);
    });

    it("should fail with invalid type", () => {
      const error = ctx.runExpectError("history --type invalid");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("action filter", () => {
    beforeEach(() => {
      const task = ctx.runToon<Task>('task create -t "Test Task"');
      ctx.run(`task update ${task.id} -s in_progress`);
      ctx.run(`task delete ${task.id}`);
    });

    it("should filter by create action", () => {
      const result = ctx.runToon<HistoryResponse>("history --action create");
      expect(result.events.every(e => e.action === "create")).toBe(true);
    });

    it("should filter by update action", () => {
      const result = ctx.runToon<HistoryResponse>("history --action update");
      expect(result.events.every(e => e.action === "update")).toBe(true);
    });

    it("should filter by delete action", () => {
      const result = ctx.runToon<HistoryResponse>("history --action delete");
      expect(result.events.every(e => e.action === "delete")).toBe(true);
    });

    it("should filter by multiple actions", () => {
      const result = ctx.runToon<HistoryResponse>("history --action create,update");
      expect(result.events.every(e => e.action === "create" || e.action === "update")).toBe(true);
    });

    it("should fail with invalid action", () => {
      const error = ctx.runExpectError("history --action invalid");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("date filters", () => {
    it("should filter by since date", () => {
      ctx.run('task create -t "Test Task"');

      // Use today's date
      const today = new Date().toISOString().split("T")[0];
      const result = ctx.runToon<HistoryResponse>(`history --since ${today}`);
      expect(result.events.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter by until date", () => {
      ctx.run('task create -t "Test Task"');

      // Use tomorrow's date
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const result = ctx.runToon<HistoryResponse>(`history --until ${tomorrow}`);
      expect(result.events.length).toBeGreaterThanOrEqual(1);
    });

    it("should fail with invalid since date", () => {
      const error = ctx.runExpectError("history --since invalid-date");
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with invalid until date", () => {
      const error = ctx.runExpectError("history --until invalid-date");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("pagination", () => {
    beforeEach(() => {
      for (let i = 1; i <= 60; i++) {
        ctx.run(`task create -t "Task ${i}"`);
      }
    });

    it("should respect limit parameter", () => {
      const result = ctx.runToon<HistoryResponse>("history --limit 10");
      expect(result.events.length).toBeLessThanOrEqual(10);
      expect(result.limit).toBe(10);
    });

    it("should respect page parameter", () => {
      const page1 = ctx.runToon<HistoryResponse>("history --limit 10 --page 1");
      const page2 = ctx.runToon<HistoryResponse>("history --limit 10 --page 2");

      expect(page1.page).toBe(1);
      expect(page2.page).toBe(2);

      if (page1.events.length > 0 && page2.events.length > 0) {
        expect(page1.events[0].id).not.toBe(page2.events[0].id);
      }
    });

    it("should fail with invalid limit", () => {
      const error = ctx.runExpectError("history --limit 0");
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with invalid page", () => {
      const error = ctx.runExpectError("history --page 0");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });
});
