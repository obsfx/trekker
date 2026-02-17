import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createTestContext, initTrekker, type TestContext } from "../helpers/test-context";

interface Epic {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

describe("epic command", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("create", () => {
    it("should create an epic with title only", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic"');

      expect(epic.id).toMatch(/^TREKKER-EPIC-\d+$/);
      expect(epic.title).toBe("Test Epic");
      expect(epic.description).toBeNull();
      expect(epic.status).toBe("todo");
      expect(epic.priority).toBe(2); // default priority
    });

    it("should create an epic with all options", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Full Epic" -d "Description here" -p 1 -s in_progress');

      expect(epic.title).toBe("Full Epic");
      expect(epic.description).toBe("Description here");
      expect(epic.status).toBe("in_progress");
      expect(epic.priority).toBe(1);
    });

    it("should fail without title", () => {
      const error = ctx.runExpectError("epic create");
      expect(error).toContain("required");
    });

    it("should fail with invalid status", () => {
      const error = ctx.runExpectError('epic create -t "Test" -s invalid_status');
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with invalid priority", () => {
      const error = ctx.runExpectError('epic create -t "Test" -p 10');
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should create epic without description", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Test"');
      expect(epic.description).toBeNull();
    });
  });

  describe("list", () => {
    it("should list all epics", () => {
      ctx.run('epic create -t "Epic 1"');
      ctx.run('epic create -t "Epic 2"');
      ctx.run('epic create -t "Epic 3"');

      const epics = ctx.runToon<Epic[]>("epic list");
      expect(epics).toHaveLength(3);
    });

    it("should return empty array when no epics", () => {
      const epics = ctx.runToon<Epic[]>("epic list");
      expect(epics).toHaveLength(0);
    });

    it("should filter by status", () => {
      ctx.run('epic create -t "Todo Epic" -s todo');
      ctx.run('epic create -t "In Progress Epic" -s in_progress');
      ctx.run('epic create -t "Completed Epic" -s completed');

      const todoEpics = ctx.runToon<Epic[]>("epic list -s todo");
      expect(todoEpics).toHaveLength(1);
      expect(todoEpics[0].title).toBe("Todo Epic");

      const inProgressEpics = ctx.runToon<Epic[]>("epic list -s in_progress");
      expect(inProgressEpics).toHaveLength(1);
      expect(inProgressEpics[0].title).toBe("In Progress Epic");
    });

    it("should fail with invalid status filter", () => {
      const error = ctx.runExpectError("epic list -s invalid_status");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("show", () => {
    it("should show epic details", () => {
      const created = ctx.runToon<Epic>('epic create -t "Show Test" -d "Test description"');
      const shown = ctx.runToon<Epic>(`epic show ${created.id}`);

      expect(shown.id).toBe(created.id);
      expect(shown.title).toBe("Show Test");
      expect(shown.description).toBe("Test description");
    });

    it("should fail for non-existent epic", () => {
      const error = ctx.runExpectError("epic show TREKKER-EPIC-999");
      expect(error.toLowerCase()).toContain("not found");
    });
  });

  describe("update", () => {
    it("should update epic title", () => {
      const created = ctx.runToon<Epic>('epic create -t "Original Title"');
      const updated = ctx.runToon<Epic>(`epic update ${created.id} -t "New Title"`);

      expect(updated.title).toBe("New Title");
    });

    it("should update epic description", () => {
      const created = ctx.runToon<Epic>('epic create -t "Test"');
      const updated = ctx.runToon<Epic>(`epic update ${created.id} -d "New description"`);

      expect(updated.description).toBe("New description");
    });

    it("should update epic status", () => {
      const created = ctx.runToon<Epic>('epic create -t "Test"');
      const updated = ctx.runToon<Epic>(`epic update ${created.id} -s in_progress`);

      expect(updated.status).toBe("in_progress");
    });

    it("should update epic priority", () => {
      const created = ctx.runToon<Epic>('epic create -t "Test"');
      const updated = ctx.runToon<Epic>(`epic update ${created.id} -p 0`);

      expect(updated.priority).toBe(0);
    });

    it("should update multiple fields at once", () => {
      const created = ctx.runToon<Epic>('epic create -t "Test"');
      const updated = ctx.runToon<Epic>(`epic update ${created.id} -t "Updated" -d "New desc" -s completed -p 1`);

      expect(updated.title).toBe("Updated");
      expect(updated.description).toBe("New desc");
      expect(updated.status).toBe("completed");
      expect(updated.priority).toBe(1);
    });

    it("should fail for non-existent epic", () => {
      const error = ctx.runExpectError('epic update TREKKER-EPIC-999 -t "Test"');
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should fail with invalid status", () => {
      const created = ctx.runToon<Epic>('epic create -t "Test"');
      const error = ctx.runExpectError(`epic update ${created.id} -s invalid`);
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with invalid priority", () => {
      const created = ctx.runToon<Epic>('epic create -t "Test"');
      const error = ctx.runExpectError(`epic update ${created.id} -p 99`);
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("delete", () => {
    it("should delete an epic", () => {
      const created = ctx.runToon<Epic>('epic create -t "To Delete"');
      const output = ctx.run(`epic delete ${created.id}`);

      expect(output.toLowerCase()).toContain("deleted");

      const error = ctx.runExpectError(`epic show ${created.id}`);
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should fail for non-existent epic", () => {
      const error = ctx.runExpectError("epic delete TREKKER-EPIC-999");
      expect(error.toLowerCase()).toContain("not found");
    });
  });

  describe("complete", () => {
    it("should complete an epic and archive its tasks", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Complete Test"');
      ctx.run(`task create -t "Task 1" -e ${epic.id}`);
      ctx.run(`task create -t "Task 2" -e ${epic.id}`);

      const result = ctx.runToon<{ epic: string; archived: { tasks: number; subtasks: number } }>(`epic complete ${epic.id}`);

      expect(result.epic).toBe(epic.id);
      expect(result.archived.tasks).toBe(2);
    });

    it("should complete epic with subtasks", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Complete Test"');
      const task = ctx.runToon<{ id: string }>(`task create -t "Parent Task" -e ${epic.id}`);
      ctx.run(`subtask create ${task.id} -t "Subtask 1"`);
      ctx.run(`subtask create ${task.id} -t "Subtask 2"`);

      const result = ctx.runToon<{ epic: string; archived: { tasks: number; subtasks: number } }>(`epic complete ${epic.id}`);

      expect(result.archived.tasks).toBe(1);
      expect(result.archived.subtasks).toBe(2);
    });

    it("should complete epic with no tasks", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Empty Epic"');
      const result = ctx.runToon<{ epic: string; archived: { tasks: number; subtasks: number } }>(`epic complete ${epic.id}`);

      expect(result.archived.tasks).toBe(0);
      expect(result.archived.subtasks).toBe(0);
    });

    it("should fail for non-existent epic", () => {
      const error = ctx.runExpectError("epic complete TREKKER-EPIC-999");
      expect(error.toLowerCase()).toContain("not found");
    });
  });
});
