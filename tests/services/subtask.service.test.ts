import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServiceContext, initTrekkerService, type ServiceContext } from "../helpers/service-context";

describe("subtask service (in-process)", () => {
  let ctx: ServiceContext;

  beforeEach(async () => {
    ctx = createServiceContext();
    await initTrekkerService(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("create", () => {
    it("should create a subtask under a parent task", async () => {
      const parent = await ctx.createTask({ title: "Parent Task" });
      const subtask = await ctx.createSubtask(parent.id, { title: "Subtask 1" });

      expect(subtask.id).toMatch(/^TREK-\d+$/);
      expect(subtask.title).toBe("Subtask 1");
      expect(subtask.parentTaskId).toBe(parent.id);
    });

    it("should create subtask with all options", async () => {
      const parent = await ctx.createTask({ title: "Parent Task" });
      const subtask = await ctx.createSubtask(parent.id, {
        title: "Full Subtask",
        description: "Description",
        priority: 1,
        status: "in_progress",
        tags: "tag1,tag2",
      });

      expect(subtask.title).toBe("Full Subtask");
      expect(subtask.description).toBe("Description");
      expect(subtask.status).toBe("in_progress");
      expect(subtask.priority).toBe(1);
      expect(subtask.tags).toBe("tag1,tag2");
      expect(subtask.parentTaskId).toBe(parent.id);
    });

    it("should fail for non-existent parent task", async () => {
      await expect(ctx.createSubtask("TREK-999", { title: "Subtask" }))
        .rejects.toThrow(/not found/i);
    });
  });

  describe("list", () => {
    it("should list subtasks for a parent task", async () => {
      const parent = await ctx.createTask({ title: "Parent Task" });
      await ctx.createSubtask(parent.id, { title: "Subtask 1" });
      await ctx.createSubtask(parent.id, { title: "Subtask 2" });
      await ctx.createSubtask(parent.id, { title: "Subtask 3" });

      const subtasks = await ctx.listSubtasks(parent.id);
      expect(subtasks).toHaveLength(3);
    });

    it("should return empty array when no subtasks", async () => {
      const parent = await ctx.createTask({ title: "Parent Task" });
      const subtasks = await ctx.listSubtasks(parent.id);
      expect(subtasks).toHaveLength(0);
    });

    it("should only list subtasks for the specified parent", async () => {
      const parent1 = await ctx.createTask({ title: "Parent 1" });
      const parent2 = await ctx.createTask({ title: "Parent 2" });

      await ctx.createSubtask(parent1.id, { title: "Parent 1 - Subtask 1" });
      await ctx.createSubtask(parent2.id, { title: "Parent 2 - Subtask 1" });
      await ctx.createSubtask(parent2.id, { title: "Parent 2 - Subtask 2" });

      const parent1Subtasks = await ctx.listSubtasks(parent1.id);
      expect(parent1Subtasks).toHaveLength(1);
      expect(parent1Subtasks[0].title).toBe("Parent 1 - Subtask 1");

      const parent2Subtasks = await ctx.listSubtasks(parent2.id);
      expect(parent2Subtasks).toHaveLength(2);
    });
  });

  describe("update", () => {
    it("should update subtask title", async () => {
      const parent = await ctx.createTask({ title: "Parent Task" });
      const subtask = await ctx.createSubtask(parent.id, { title: "Original" });
      const updated = await ctx.updateTask(subtask.id, { title: "Updated" });

      expect(updated.title).toBe("Updated");
      expect(updated.parentTaskId).toBe(parent.id);
    });

    it("should update subtask status", async () => {
      const parent = await ctx.createTask({ title: "Parent Task" });
      const subtask = await ctx.createSubtask(parent.id, { title: "Subtask" });
      const updated = await ctx.updateTask(subtask.id, { status: "completed" });

      expect(updated.status).toBe("completed");
    });

    it("should update subtask priority", async () => {
      const parent = await ctx.createTask({ title: "Parent Task" });
      const subtask = await ctx.createSubtask(parent.id, { title: "Subtask" });
      const updated = await ctx.updateTask(subtask.id, { priority: 0 });

      expect(updated.priority).toBe(0);
    });
  });

  describe("delete", () => {
    it("should delete a subtask", async () => {
      const parent = await ctx.createTask({ title: "Parent Task" });
      const subtask = await ctx.createSubtask(parent.id, { title: "Subtask" });
      await ctx.deleteTask(subtask.id);

      const task = await ctx.getTask(subtask.id);
      expect(task).toBeUndefined();
    });

    it("should not delete parent when subtask is deleted", async () => {
      const parent = await ctx.createTask({ title: "Parent Task" });
      const subtask = await ctx.createSubtask(parent.id, { title: "Subtask" });
      await ctx.deleteTask(subtask.id);

      const parentTask = await ctx.getTask(parent.id);
      expect(parentTask).toBeDefined();
      expect(parentTask!.title).toBe("Parent Task");
    });
  });
});
