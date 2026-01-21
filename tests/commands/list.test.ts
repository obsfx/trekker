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

interface ListItem {
  id: string;
  type: "epic" | "task" | "subtask";
  title: string;
  status: string;
  priority: number;
  parentId?: string;
  createdAt: string;
}

interface ListResponse {
  total: number;
  page: number;
  limit: number;
  items: ListItem[];
}

describe("list command", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("basic listing", () => {
    it("should list all epics, tasks, and subtasks", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic"');
      const task = ctx.runToon<Task>(`task create -t "Test Task" -e ${epic.id}`);
      ctx.run(`subtask create ${task.id} -t "Test Subtask"`);

      const result = ctx.runToon<ListResponse>("list");
      expect(result.total).toBe(3);
      expect(result.items.some(i => i.type === "epic")).toBe(true);
      expect(result.items.some(i => i.type === "task")).toBe(true);
      expect(result.items.some(i => i.type === "subtask")).toBe(true);
    });

    it("should return empty list when no items", () => {
      const result = ctx.runToon<ListResponse>("list");
      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe("type filter", () => {
    beforeEach(() => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic"');
      const task = ctx.runToon<Task>(`task create -t "Test Task" -e ${epic.id}`);
      ctx.run(`subtask create ${task.id} -t "Test Subtask"`);
    });

    it("should filter by epic type", () => {
      const result = ctx.runToon<ListResponse>("list --type epic");
      expect(result.items.every(i => i.type === "epic")).toBe(true);
    });

    it("should filter by task type", () => {
      const result = ctx.runToon<ListResponse>("list --type task");
      expect(result.items.every(i => i.type === "task")).toBe(true);
    });

    it("should filter by subtask type", () => {
      const result = ctx.runToon<ListResponse>("list --type subtask");
      expect(result.items.every(i => i.type === "subtask")).toBe(true);
    });

    it("should filter by multiple types", () => {
      const result = ctx.runToon<ListResponse>("list --type epic,task");
      expect(result.items.every(i => i.type === "epic" || i.type === "task")).toBe(true);
    });

    it("should fail with invalid type", () => {
      const error = ctx.runExpectError("list --type invalid");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("status filter", () => {
    beforeEach(() => {
      ctx.run('task create -t "Todo Task" -s todo');
      ctx.run('task create -t "In Progress Task" -s in_progress');
      ctx.run('task create -t "Completed Task" -s completed');
    });

    it("should filter by single status", () => {
      const result = ctx.runToon<ListResponse>("list --status todo");
      expect(result.items.every(i => i.status === "todo")).toBe(true);
    });

    it("should filter by multiple statuses", () => {
      const result = ctx.runToon<ListResponse>("list --status todo,in_progress");
      expect(result.items.every(i => i.status === "todo" || i.status === "in_progress")).toBe(true);
    });
  });

  describe("priority filter", () => {
    beforeEach(() => {
      ctx.run('task create -t "Critical Task" -p 0');
      ctx.run('task create -t "High Task" -p 1');
      ctx.run('task create -t "Medium Task" -p 2');
      ctx.run('task create -t "Low Task" -p 3');
    });

    it("should filter by single priority", () => {
      const result = ctx.runToon<ListResponse>("list --priority 0");
      expect(result.items.every(i => i.priority === 0)).toBe(true);
    });

    it("should filter by multiple priorities", () => {
      const result = ctx.runToon<ListResponse>("list --priority 0,1");
      expect(result.items.every(i => i.priority === 0 || i.priority === 1)).toBe(true);
    });

    it("should fail with invalid priority", () => {
      const error = ctx.runExpectError("list --priority 10");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("date filters", () => {
    it("should filter by since date", () => {
      ctx.run('task create -t "Test Task"');

      const today = new Date().toISOString().split("T")[0];
      const result = ctx.runToon<ListResponse>(`list --since ${today}`);
      expect(result.items.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter by until date", () => {
      ctx.run('task create -t "Test Task"');

      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const result = ctx.runToon<ListResponse>(`list --until ${tomorrow}`);
      expect(result.items.length).toBeGreaterThanOrEqual(1);
    });

    it("should fail with invalid since date", () => {
      const error = ctx.runExpectError("list --since invalid-date");
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with invalid until date", () => {
      const error = ctx.runExpectError("list --until invalid-date");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("sorting", () => {
    beforeEach(() => {
      ctx.run('task create -t "A Task" -p 2');
      ctx.run('task create -t "B Task" -p 0');
      ctx.run('task create -t "C Task" -p 1');
    });

    it("should sort by priority ascending", () => {
      const result = ctx.runToon<ListResponse>("list --sort priority:asc --type task");
      const priorities = result.items.map(i => i.priority);

      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i - 1]);
      }
    });

    it("should sort by priority descending", () => {
      const result = ctx.runToon<ListResponse>("list --sort priority:desc --type task");
      const priorities = result.items.map(i => i.priority);

      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeLessThanOrEqual(priorities[i - 1]);
      }
    });

    it("should sort by created date descending (default)", () => {
      const result = ctx.runToon<ListResponse>("list --sort created:desc --type task");
      const dates = result.items.map(i => new Date(i.createdAt).getTime());

      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
      }
    });

    it("should sort by multiple fields", () => {
      // Create items with same priority but different titles
      ctx.run('task create -t "Z Task" -p 1');

      const result = ctx.runToon<ListResponse>("list --sort priority:asc,created:desc --type task");
      expect(result.items.length).toBeGreaterThan(0);
    });

    it("should fail with invalid sort field", () => {
      const error = ctx.runExpectError("list --sort invalid:asc");
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
      const result = ctx.runToon<ListResponse>("list --limit 10");
      expect(result.items.length).toBeLessThanOrEqual(10);
      expect(result.limit).toBe(10);
    });

    it("should respect page parameter", () => {
      const page1 = ctx.runToon<ListResponse>("list --limit 10 --page 1");
      const page2 = ctx.runToon<ListResponse>("list --limit 10 --page 2");

      expect(page1.page).toBe(1);
      expect(page2.page).toBe(2);

      if (page1.items.length > 0 && page2.items.length > 0) {
        expect(page1.items[0].id).not.toBe(page2.items[0].id);
      }
    });

    it("should fail with invalid limit", () => {
      const error = ctx.runExpectError("list --limit 0");
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with invalid page", () => {
      const error = ctx.runExpectError("list --page 0");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("combined filters", () => {
    it("should combine type and status filters", () => {
      ctx.run('task create -t "Todo Task" -s todo');
      ctx.run('task create -t "In Progress Task" -s in_progress');
      ctx.run('epic create -t "Todo Epic" -s todo');

      const result = ctx.runToon<ListResponse>("list --type task --status todo");
      expect(result.items.every(i => i.type === "task" && i.status === "todo")).toBe(true);
      expect(result.total).toBe(1);
    });

    it("should combine multiple filters", () => {
      ctx.run('task create -t "High Todo" -p 1 -s todo');
      ctx.run('task create -t "Low Todo" -p 3 -s todo');
      ctx.run('task create -t "High Done" -p 1 -s completed');

      const result = ctx.runToon<ListResponse>("list --type task --status todo --priority 1");
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe("High Todo");
    });
  });
});
