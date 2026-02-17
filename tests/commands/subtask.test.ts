import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createTestContext, initTrekker, type TestContext } from "../helpers/test-context";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  tags: string | null;
  epicId: string | null;
  parentTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Epic {
  id: string;
  title: string;
}

describe("subtask command", () => {
  let ctx: TestContext;
  let parentTask: Task;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
    parentTask = ctx.runToon<Task>('task create -t "Parent Task"');
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("create", () => {
    it("should create a subtask with title only", () => {
      const subtask = ctx.runToon<Task>(`subtask create ${parentTask.id} -t "Test Subtask"`);

      expect(subtask.id).toMatch(/^TREKKER-TREK-\d+$/);
      expect(subtask.title).toBe("Test Subtask");
      expect(subtask.description).toBeNull();
      expect(subtask.status).toBe("todo");
      expect(subtask.priority).toBe(2); // default priority
      expect(subtask.parentTaskId).toBe(parentTask.id);
    });

    it("should create a subtask with all options", () => {
      const subtask = ctx.runToon<Task>(`subtask create ${parentTask.id} -t "Full Subtask" -d "Description" -p 1 -s in_progress`);

      expect(subtask.title).toBe("Full Subtask");
      expect(subtask.description).toBe("Description");
      expect(subtask.status).toBe("in_progress");
      expect(subtask.priority).toBe(1);
      expect(subtask.parentTaskId).toBe(parentTask.id);
    });

    it("should inherit epic from parent task", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic"');
      const taskWithEpic = ctx.runToon<Task>(`task create -t "Task in Epic" -e ${epic.id}`);
      const subtask = ctx.runToon<Task>(`subtask create ${taskWithEpic.id} -t "Subtask"`);

      expect(subtask.epicId).toBe(epic.id);
    });

    it("should fail without title", () => {
      const error = ctx.runExpectError(`subtask create ${parentTask.id}`);
      expect(error).toContain("required");
    });

    it("should fail with non-existent parent task", () => {
      const error = ctx.runExpectError('subtask create TREKKER-TREK-999 -t "Test"');
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should fail with invalid status", () => {
      const error = ctx.runExpectError(`subtask create ${parentTask.id} -t "Test" -s invalid_status`);
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with invalid priority", () => {
      const error = ctx.runExpectError(`subtask create ${parentTask.id} -t "Test" -p 10`);
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("list", () => {
    it("should list all subtasks of a parent task", () => {
      ctx.run(`subtask create ${parentTask.id} -t "Subtask 1"`);
      ctx.run(`subtask create ${parentTask.id} -t "Subtask 2"`);
      ctx.run(`subtask create ${parentTask.id} -t "Subtask 3"`);

      const subtasks = ctx.runToon<Task[]>(`subtask list ${parentTask.id}`);
      expect(subtasks).toHaveLength(3);
    });

    it("should return empty array when no subtasks", () => {
      const subtasks = ctx.runToon<Task[]>(`subtask list ${parentTask.id}`);
      expect(subtasks).toHaveLength(0);
    });

    it("should only list subtasks of specified parent", () => {
      const otherParent = ctx.runToon<Task>('task create -t "Other Parent"');

      ctx.run(`subtask create ${parentTask.id} -t "Subtask 1"`);
      ctx.run(`subtask create ${otherParent.id} -t "Other Subtask"`);

      const subtasks = ctx.runToon<Task[]>(`subtask list ${parentTask.id}`);
      expect(subtasks).toHaveLength(1);
      expect(subtasks[0].title).toBe("Subtask 1");
    });

    it("should fail with non-existent parent task", () => {
      const error = ctx.runExpectError("subtask list TREKKER-TREK-999");
      expect(error.toLowerCase()).toContain("not found");
    });
  });

  describe("update", () => {
    it("should update subtask title", () => {
      const subtask = ctx.runToon<Task>(`subtask create ${parentTask.id} -t "Original Title"`);
      const updated = ctx.runToon<Task>(`subtask update ${subtask.id} -t "New Title"`);

      expect(updated.title).toBe("New Title");
    });

    it("should update subtask description", () => {
      const subtask = ctx.runToon<Task>(`subtask create ${parentTask.id} -t "Test"`);
      const updated = ctx.runToon<Task>(`subtask update ${subtask.id} -d "New description"`);

      expect(updated.description).toBe("New description");
    });

    it("should update subtask status", () => {
      const subtask = ctx.runToon<Task>(`subtask create ${parentTask.id} -t "Test"`);
      const updated = ctx.runToon<Task>(`subtask update ${subtask.id} -s in_progress`);

      expect(updated.status).toBe("in_progress");
    });

    it("should update subtask priority", () => {
      const subtask = ctx.runToon<Task>(`subtask create ${parentTask.id} -t "Test"`);
      const updated = ctx.runToon<Task>(`subtask update ${subtask.id} -p 0`);

      expect(updated.priority).toBe(0);
    });

    it("should update multiple fields at once", () => {
      const subtask = ctx.runToon<Task>(`subtask create ${parentTask.id} -t "Test"`);
      const updated = ctx.runToon<Task>(`subtask update ${subtask.id} -t "Updated" -d "New desc" -s completed -p 1`);

      expect(updated.title).toBe("Updated");
      expect(updated.description).toBe("New desc");
      expect(updated.status).toBe("completed");
      expect(updated.priority).toBe(1);
    });

    it("should fail for non-existent subtask", () => {
      const error = ctx.runExpectError('subtask update TREKKER-TREK-999 -t "Test"');
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should fail when trying to update a regular task", () => {
      const error = ctx.runExpectError(`subtask update ${parentTask.id} -t "Test"`);
      expect(error.toLowerCase()).toContain("not a subtask");
    });

    it("should fail with invalid status", () => {
      const subtask = ctx.runToon<Task>(`subtask create ${parentTask.id} -t "Test"`);
      const error = ctx.runExpectError(`subtask update ${subtask.id} -s invalid`);
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with invalid priority", () => {
      const subtask = ctx.runToon<Task>(`subtask create ${parentTask.id} -t "Test"`);
      const error = ctx.runExpectError(`subtask update ${subtask.id} -p 99`);
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("delete", () => {
    it("should delete a subtask", () => {
      const subtask = ctx.runToon<Task>(`subtask create ${parentTask.id} -t "To Delete"`);
      const output = ctx.run(`subtask delete ${subtask.id}`);

      expect(output.toLowerCase()).toContain("deleted");

      const subtasks = ctx.runToon<Task[]>(`subtask list ${parentTask.id}`);
      expect(subtasks).toHaveLength(0);
    });

    it("should fail for non-existent subtask", () => {
      const error = ctx.runExpectError("subtask delete TREKKER-TREK-999");
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should fail when trying to delete a regular task", () => {
      const error = ctx.runExpectError(`subtask delete ${parentTask.id}`);
      expect(error.toLowerCase()).toContain("not a subtask");
    });
  });
});
