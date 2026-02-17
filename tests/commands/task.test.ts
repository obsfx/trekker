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

describe("task command", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("create", () => {
    it("should create a task with title only", () => {
      const task = ctx.runToon<Task>('task create -t "Test Task"');

      expect(task.id).toMatch(/^TREKKER-TREK-\d+$/);
      expect(task.title).toBe("Test Task");
      expect(task.description).toBeNull();
      expect(task.status).toBe("todo");
      expect(task.priority).toBe(2); // default priority
      expect(task.tags).toBeNull();
      expect(task.epicId).toBeNull();
      expect(task.parentTaskId).toBeNull();
    });

    it("should create a task with all options", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic"');
      const task = ctx.runToon<Task>(`task create -t "Full Task" -d "Description" -p 1 -s in_progress --tags "tag1,tag2" -e ${epic.id}`);

      expect(task.title).toBe("Full Task");
      expect(task.description).toBe("Description");
      expect(task.status).toBe("in_progress");
      expect(task.priority).toBe(1);
      expect(task.tags).toBe("tag1,tag2");
      expect(task.epicId).toBe(epic.id);
    });

    it("should fail without title", () => {
      const error = ctx.runExpectError("task create");
      expect(error).toContain("required");
    });

    it("should fail with invalid status", () => {
      const error = ctx.runExpectError('task create -t "Test" -s invalid_status');
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with invalid priority", () => {
      const error = ctx.runExpectError('task create -t "Test" -p 10');
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with non-existent epic", () => {
      const error = ctx.runExpectError('task create -t "Test" -e TREKKER-EPIC-999');
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should create task without description", () => {
      const task = ctx.runToon<Task>('task create -t "Test"');
      expect(task.description).toBeNull();
    });
  });

  describe("list", () => {
    it("should list all tasks", () => {
      ctx.run('task create -t "Task 1"');
      ctx.run('task create -t "Task 2"');
      ctx.run('task create -t "Task 3"');

      const tasks = ctx.runToon<Task[]>("task list");
      expect(tasks).toHaveLength(3);
    });

    it("should return empty array when no tasks", () => {
      const tasks = ctx.runToon<Task[]>("task list");
      expect(tasks).toHaveLength(0);
    });

    it("should filter by status", () => {
      ctx.run('task create -t "Todo Task" -s todo');
      ctx.run('task create -t "In Progress Task" -s in_progress');
      ctx.run('task create -t "Completed Task" -s completed');

      const todoTasks = ctx.runToon<Task[]>("task list -s todo");
      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0].title).toBe("Todo Task");

      const inProgressTasks = ctx.runToon<Task[]>("task list -s in_progress");
      expect(inProgressTasks).toHaveLength(1);
      expect(inProgressTasks[0].title).toBe("In Progress Task");
    });

    it("should filter by epic", () => {
      const epic1 = ctx.runToon<Epic>('epic create -t "Epic 1"');
      const epic2 = ctx.runToon<Epic>('epic create -t "Epic 2"');

      ctx.run(`task create -t "Task in Epic 1" -e ${epic1.id}`);
      ctx.run(`task create -t "Task in Epic 2" -e ${epic2.id}`);
      ctx.run('task create -t "Task without Epic"');

      const epic1Tasks = ctx.runToon<Task[]>(`task list -e ${epic1.id}`);
      expect(epic1Tasks).toHaveLength(1);
      expect(epic1Tasks[0].title).toBe("Task in Epic 1");
    });

    it("should not list subtasks", () => {
      const parent = ctx.runToon<Task>('task create -t "Parent Task"');
      ctx.run(`subtask create ${parent.id} -t "Subtask 1"`);
      ctx.run(`subtask create ${parent.id} -t "Subtask 2"`);

      const tasks = ctx.runToon<Task[]>("task list");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Parent Task");
    });

    it("should fail with invalid status filter", () => {
      const error = ctx.runExpectError("task list -s invalid_status");
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("show", () => {
    it("should show task details", () => {
      const created = ctx.runToon<Task>('task create -t "Show Test" -d "Test description"');
      const shown = ctx.runToon<Task>(`task show ${created.id}`);

      expect(shown.id).toBe(created.id);
      expect(shown.title).toBe("Show Test");
      expect(shown.description).toBe("Test description");
    });

    it("should fail for non-existent task", () => {
      const error = ctx.runExpectError("task show TREKKER-TREK-999");
      expect(error.toLowerCase()).toContain("not found");
    });
  });

  describe("update", () => {
    it("should update task title", () => {
      const created = ctx.runToon<Task>('task create -t "Original Title"');
      const updated = ctx.runToon<Task>(`task update ${created.id} -t "New Title"`);

      expect(updated.title).toBe("New Title");
    });

    it("should update task description", () => {
      const created = ctx.runToon<Task>('task create -t "Test"');
      const updated = ctx.runToon<Task>(`task update ${created.id} -d "New description"`);

      expect(updated.description).toBe("New description");
    });

    it("should update task status", () => {
      const created = ctx.runToon<Task>('task create -t "Test"');
      const updated = ctx.runToon<Task>(`task update ${created.id} -s in_progress`);

      expect(updated.status).toBe("in_progress");
    });

    it("should update task priority", () => {
      const created = ctx.runToon<Task>('task create -t "Test"');
      const updated = ctx.runToon<Task>(`task update ${created.id} -p 0`);

      expect(updated.priority).toBe(0);
    });

    it("should update task tags", () => {
      const created = ctx.runToon<Task>('task create -t "Test"');
      const updated = ctx.runToon<Task>(`task update ${created.id} --tags "new,tags"`);

      expect(updated.tags).toBe("new,tags");
    });

    it("should assign task to epic", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic"');
      const created = ctx.runToon<Task>('task create -t "Test"');
      const updated = ctx.runToon<Task>(`task update ${created.id} -e ${epic.id}`);

      expect(updated.epicId).toBe(epic.id);
    });

    it("should remove task from epic with --no-epic", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic"');
      const created = ctx.runToon<Task>(`task create -t "Test" -e ${epic.id}`);
      expect(created.epicId).toBe(epic.id);

      const updated = ctx.runToon<Task>(`task update ${created.id} --no-epic`);
      expect(updated.epicId).toBeNull();
    });

    it("should update multiple fields at once", () => {
      const created = ctx.runToon<Task>('task create -t "Test"');
      const updated = ctx.runToon<Task>(`task update ${created.id} -t "Updated" -d "New desc" -s completed -p 1 --tags "a,b"`);

      expect(updated.title).toBe("Updated");
      expect(updated.description).toBe("New desc");
      expect(updated.status).toBe("completed");
      expect(updated.priority).toBe(1);
      expect(updated.tags).toBe("a,b");
    });

    it("should fail for non-existent task", () => {
      const error = ctx.runExpectError('task update TREKKER-TREK-999 -t "Test"');
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should fail with invalid status", () => {
      const created = ctx.runToon<Task>('task create -t "Test"');
      const error = ctx.runExpectError(`task update ${created.id} -s invalid`);
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should fail with invalid priority", () => {
      const created = ctx.runToon<Task>('task create -t "Test"');
      const error = ctx.runExpectError(`task update ${created.id} -p 99`);
      expect(error.toLowerCase()).toContain("invalid");
    });
  });

  describe("delete", () => {
    it("should delete a task", () => {
      const created = ctx.runToon<Task>('task create -t "To Delete"');
      const output = ctx.run(`task delete ${created.id}`);

      expect(output.toLowerCase()).toContain("deleted");

      const error = ctx.runExpectError(`task show ${created.id}`);
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should fail for non-existent task", () => {
      const error = ctx.runExpectError("task delete TREKKER-TREK-999");
      expect(error.toLowerCase()).toContain("not found");
    });
  });
});
