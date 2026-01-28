import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServiceContext, initTrekkerService, type ServiceContext } from "../helpers/service-context";
import type { Task, Epic } from "../../src/types";

describe("task service (in-process)", () => {
  let ctx: ServiceContext;

  beforeEach(async () => {
    ctx = createServiceContext();
    await initTrekkerService(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("create", () => {
    it("should create a task with title only", async () => {
      const task = await ctx.createTask({ title: "Test Task" });

      expect(task.id).toMatch(/^TREK-\d+$/);
      expect(task.title).toBe("Test Task");
      expect(task.description).toBeNull();
      expect(task.status).toBe("todo");
      expect(task.priority).toBe(2);
      expect(task.tags).toBeNull();
      expect(task.epicId).toBeNull();
      expect(task.parentTaskId).toBeNull();
    });

    it("should create a task with all options", async () => {
      const epic = await ctx.createEpic({ title: "Test Epic" });
      const task = await ctx.createTask({
        title: "Full Task",
        description: "Description",
        priority: 1,
        status: "in_progress",
        tags: "tag1,tag2",
        epicId: epic.id,
      });

      expect(task.title).toBe("Full Task");
      expect(task.description).toBe("Description");
      expect(task.status).toBe("in_progress");
      expect(task.priority).toBe(1);
      expect(task.tags).toBe("tag1,tag2");
      expect(task.epicId).toBe(epic.id);
    });

    it("should fail with non-existent epic", async () => {
      await expect(ctx.createTask({ title: "Test", epicId: "EPIC-999" }))
        .rejects.toThrow(/not found/i);
    });
  });

  describe("list", () => {
    it("should list all tasks", async () => {
      await ctx.createTask({ title: "Task 1" });
      await ctx.createTask({ title: "Task 2" });
      await ctx.createTask({ title: "Task 3" });

      const tasks = await ctx.listTasks();
      expect(tasks).toHaveLength(3);
    });

    it("should return empty array when no tasks", async () => {
      const tasks = await ctx.listTasks();
      expect(tasks).toHaveLength(0);
    });

    it("should filter by status", async () => {
      await ctx.createTask({ title: "Todo Task", status: "todo" });
      await ctx.createTask({ title: "In Progress Task", status: "in_progress" });
      await ctx.createTask({ title: "Completed Task", status: "completed" });

      const todoTasks = await ctx.listTasks({ status: "todo" });
      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0].title).toBe("Todo Task");

      const inProgressTasks = await ctx.listTasks({ status: "in_progress" });
      expect(inProgressTasks).toHaveLength(1);
      expect(inProgressTasks[0].title).toBe("In Progress Task");
    });

    it("should filter by epic", async () => {
      const epic1 = await ctx.createEpic({ title: "Epic 1" });
      const epic2 = await ctx.createEpic({ title: "Epic 2" });

      await ctx.createTask({ title: "Task in Epic 1", epicId: epic1.id });
      await ctx.createTask({ title: "Task in Epic 2", epicId: epic2.id });
      await ctx.createTask({ title: "Task without Epic" });

      const epic1Tasks = await ctx.listTasks({ epicId: epic1.id });
      expect(epic1Tasks).toHaveLength(1);
      expect(epic1Tasks[0].title).toBe("Task in Epic 1");
    });

    it("should not list subtasks when filtering for top-level tasks", async () => {
      const parent = await ctx.createTask({ title: "Parent Task" });
      await ctx.createSubtask(parent.id, { title: "Subtask 1" });
      await ctx.createSubtask(parent.id, { title: "Subtask 2" });

      // Use parentTaskId: null to get only top-level tasks (matches CLI behavior)
      const tasks = await ctx.listTasks({ parentTaskId: null });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Parent Task");
    });
  });

  describe("show", () => {
    it("should show task details", async () => {
      const created = await ctx.createTask({ title: "Show Test", description: "Test description" });
      const shown = await ctx.getTask(created.id);

      expect(shown).toBeDefined();
      expect(shown!.id).toBe(created.id);
      expect(shown!.title).toBe("Show Test");
      expect(shown!.description).toBe("Test description");
    });

    it("should return undefined for non-existent task", async () => {
      const task = await ctx.getTask("TREK-999");
      expect(task).toBeUndefined();
    });
  });

  describe("update", () => {
    it("should update task title", async () => {
      const created = await ctx.createTask({ title: "Original Title" });
      const updated = await ctx.updateTask(created.id, { title: "New Title" });

      expect(updated.title).toBe("New Title");
    });

    it("should update task description", async () => {
      const created = await ctx.createTask({ title: "Test" });
      const updated = await ctx.updateTask(created.id, { description: "New description" });

      expect(updated.description).toBe("New description");
    });

    it("should update task status", async () => {
      const created = await ctx.createTask({ title: "Test" });
      const updated = await ctx.updateTask(created.id, { status: "in_progress" });

      expect(updated.status).toBe("in_progress");
    });

    it("should update task priority", async () => {
      const created = await ctx.createTask({ title: "Test" });
      const updated = await ctx.updateTask(created.id, { priority: 0 });

      expect(updated.priority).toBe(0);
    });

    it("should update task tags", async () => {
      const created = await ctx.createTask({ title: "Test" });
      const updated = await ctx.updateTask(created.id, { tags: "new,tags" });

      expect(updated.tags).toBe("new,tags");
    });

    it("should assign task to epic", async () => {
      const epic = await ctx.createEpic({ title: "Test Epic" });
      const created = await ctx.createTask({ title: "Test" });
      const updated = await ctx.updateTask(created.id, { epicId: epic.id });

      expect(updated.epicId).toBe(epic.id);
    });

    it("should remove task from epic", async () => {
      const epic = await ctx.createEpic({ title: "Test Epic" });
      const created = await ctx.createTask({ title: "Test", epicId: epic.id });
      expect(created.epicId).toBe(epic.id);

      const updated = await ctx.updateTask(created.id, { epicId: null });
      expect(updated.epicId).toBeNull();
    });

    it("should update multiple fields at once", async () => {
      const created = await ctx.createTask({ title: "Test" });
      const updated = await ctx.updateTask(created.id, {
        title: "Updated",
        description: "New desc",
        status: "completed",
        priority: 1,
        tags: "a,b",
      });

      expect(updated.title).toBe("Updated");
      expect(updated.description).toBe("New desc");
      expect(updated.status).toBe("completed");
      expect(updated.priority).toBe(1);
      expect(updated.tags).toBe("a,b");
    });

    it("should fail for non-existent task", async () => {
      await expect(ctx.updateTask("TREK-999", { title: "Test" }))
        .rejects.toThrow(/not found/i);
    });
  });

  describe("delete", () => {
    it("should delete a task", async () => {
      const created = await ctx.createTask({ title: "To Delete" });
      await ctx.deleteTask(created.id);

      const task = await ctx.getTask(created.id);
      expect(task).toBeUndefined();
    });

    it("should fail for non-existent task", async () => {
      await expect(ctx.deleteTask("TREK-999"))
        .rejects.toThrow(/not found/i);
    });
  });
});
