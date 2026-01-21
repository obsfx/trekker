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

interface SearchResult {
  id: string;
  type: "epic" | "task" | "subtask" | "comment";
  title?: string;
  snippet: string;
  status?: string;
  parentId?: string;
}

interface SearchResponse {
  query: string;
  total: number;
  page: number;
  limit: number;
  results: SearchResult[];
}

describe("search command", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("basic search", () => {
    it("should find tasks by title", () => {
      ctx.run('task create -t "Authentication module"');
      ctx.run('task create -t "Dashboard widget"');
      ctx.run('task create -t "API authentication"');

      const result = ctx.runToon<SearchResponse>("search authentication");
      expect(result.total).toBe(2);
      expect(result.results.every(r => r.title?.toLowerCase().includes("authentication"))).toBe(true);
    });

    it("should find epics by title", () => {
      ctx.run('epic create -t "User Management"');
      ctx.run('epic create -t "Payment System"');

      const result = ctx.runToon<SearchResponse>("search user");
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.results.some(r => r.type === "epic")).toBe(true);
    });

    it("should find tasks by description", () => {
      ctx.run('task create -t "Task 1" -d "Implement the login functionality"');
      ctx.run('task create -t "Task 2" -d "Create dashboard"');

      const result = ctx.runToon<SearchResponse>("search login");
      expect(result.total).toBeGreaterThanOrEqual(1);
    });

    it("should find comments by content", () => {
      const task = ctx.runToon<Task>('task create -t "Test Task"');
      ctx.run(`comment add ${task.id} -a "agent" -c "Found a critical bug in the authentication"`);

      const result = ctx.runToon<SearchResponse>("search critical");
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.results.some(r => r.type === "comment")).toBe(true);
    });

    it("should return empty results for no matches", () => {
      ctx.run('task create -t "Something else"');

      const result = ctx.runToon<SearchResponse>("search nonexistentxyz123");
      expect(result.total).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe("type filter", () => {
    beforeEach(() => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic Feature"');
      const task = ctx.runToon<Task>(`task create -t "Test Task Feature" -e ${epic.id}`);
      ctx.run(`subtask create ${task.id} -t "Test Subtask Feature"`);
      ctx.run(`comment add ${task.id} -a "agent" -c "Test comment feature"`);
    });

    it("should filter by epic type", () => {
      const result = ctx.runToon<SearchResponse>("search test --type epic");
      expect(result.results.every(r => r.type === "epic")).toBe(true);
    });

    it("should filter by task type", () => {
      const result = ctx.runToon<SearchResponse>("search test --type task");
      expect(result.results.every(r => r.type === "task")).toBe(true);
    });

    it("should filter by subtask type", () => {
      const result = ctx.runToon<SearchResponse>("search test --type subtask");
      expect(result.results.every(r => r.type === "subtask")).toBe(true);
    });

    it("should filter by comment type", () => {
      const result = ctx.runToon<SearchResponse>("search test --type comment");
      expect(result.results.every(r => r.type === "comment")).toBe(true);
    });

    it("should filter by multiple types", () => {
      const result = ctx.runToon<SearchResponse>("search test --type epic,task");
      expect(result.results.every(r => r.type === "epic" || r.type === "task")).toBe(true);
    });

    it("should fail with invalid type", () => {
      const error = ctx.runExpectError("search test --type invalid");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("status filter", () => {
    it("should filter by status", () => {
      ctx.run('task create -t "Todo task" -s todo');
      ctx.run('task create -t "In progress task" -s in_progress');
      ctx.run('task create -t "Completed task" -s completed');

      const result = ctx.runToon<SearchResponse>("search task --status todo");
      expect(result.results.every(r => r.status === "todo")).toBe(true);
    });
  });

  describe("pagination", () => {
    beforeEach(() => {
      for (let i = 1; i <= 25; i++) {
        ctx.run(`task create -t "Search Test Task ${i}"`);
      }
    });

    it("should respect limit parameter", () => {
      const result = ctx.runToon<SearchResponse>("search test --limit 10");
      expect(result.results.length).toBeLessThanOrEqual(10);
      expect(result.limit).toBe(10);
    });

    it("should respect page parameter", () => {
      const page1 = ctx.runToon<SearchResponse>("search test --limit 10 --page 1");
      const page2 = ctx.runToon<SearchResponse>("search test --limit 10 --page 2");

      expect(page1.page).toBe(1);
      expect(page2.page).toBe(2);

      // Results should be different between pages
      if (page1.results.length > 0 && page2.results.length > 0) {
        expect(page1.results[0].id).not.toBe(page2.results[0].id);
      }
    });

    it("should fail with invalid limit", () => {
      const error = ctx.runExpectError("search test --limit 0");
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with invalid page", () => {
      const error = ctx.runExpectError("search test --page 0");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("rebuild index", () => {
    it("should rebuild index with --rebuild-index flag", () => {
      ctx.run('task create -t "Indexed task"');

      // Should not throw
      const result = ctx.runToon<SearchResponse>("search indexed --rebuild-index");
      expect(result.total).toBeGreaterThanOrEqual(1);
    });
  });
});
