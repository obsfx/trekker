import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServiceContext, initTrekkerService, type ServiceContext } from "../helpers/service-context";

describe("comment service (in-process)", () => {
  let ctx: ServiceContext;

  beforeEach(async () => {
    ctx = createServiceContext();
    await initTrekkerService(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("create", () => {
    it("should add a comment to a task", async () => {
      const task = await ctx.createTask({ title: "Test Task" });
      const comment = await ctx.createComment({
        taskId: task.id,
        author: "tester",
        content: "Test comment content",
      });

      expect(comment.id).toMatch(/^CMT-\d+$/);
      expect(comment.taskId).toBe(task.id);
      expect(comment.author).toBe("tester");
      expect(comment.content).toBe("Test comment content");
    });

    it("should fail for non-existent task", async () => {
      await expect(
        ctx.createComment({
          taskId: "TREK-999",
          author: "tester",
          content: "Test",
        })
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("list", () => {
    it("should list comments for a task", async () => {
      const task = await ctx.createTask({ title: "Test Task" });
      await ctx.createComment({ taskId: task.id, author: "user1", content: "Comment 1" });
      await ctx.createComment({ taskId: task.id, author: "user2", content: "Comment 2" });
      await ctx.createComment({ taskId: task.id, author: "user1", content: "Comment 3" });

      const comments = await ctx.listComments(task.id);
      expect(comments).toHaveLength(3);
    });

    it("should return empty array when no comments", async () => {
      const task = await ctx.createTask({ title: "Test Task" });
      const comments = await ctx.listComments(task.id);
      expect(comments).toHaveLength(0);
    });

    it("should only list comments for the specified task", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      const task2 = await ctx.createTask({ title: "Task 2" });

      await ctx.createComment({ taskId: task1.id, author: "user", content: "Comment for task 1" });
      await ctx.createComment({ taskId: task2.id, author: "user", content: "Comment for task 2" });
      await ctx.createComment({ taskId: task2.id, author: "user", content: "Another for task 2" });

      const task1Comments = await ctx.listComments(task1.id);
      expect(task1Comments).toHaveLength(1);
      expect(task1Comments[0].content).toBe("Comment for task 1");

      const task2Comments = await ctx.listComments(task2.id);
      expect(task2Comments).toHaveLength(2);
    });
  });

  describe("show", () => {
    it("should show comment details", async () => {
      const task = await ctx.createTask({ title: "Test Task" });
      const created = await ctx.createComment({
        taskId: task.id,
        author: "tester",
        content: "Test content",
      });
      const shown = await ctx.getComment(created.id);

      expect(shown).toBeDefined();
      expect(shown!.id).toBe(created.id);
      expect(shown!.author).toBe("tester");
      expect(shown!.content).toBe("Test content");
    });

    it("should return undefined for non-existent comment", async () => {
      const comment = await ctx.getComment("CMT-999");
      expect(comment).toBeUndefined();
    });
  });

  describe("update", () => {
    it("should update comment content", async () => {
      const task = await ctx.createTask({ title: "Test Task" });
      const created = await ctx.createComment({
        taskId: task.id,
        author: "tester",
        content: "Original content",
      });
      const updated = await ctx.updateComment(created.id, { content: "Updated content" });

      expect(updated.content).toBe("Updated content");
      expect(updated.author).toBe("tester"); // author unchanged
    });

    it("should fail for non-existent comment", async () => {
      await expect(ctx.updateComment("CMT-999", { content: "Test" }))
        .rejects.toThrow(/not found/i);
    });
  });

  describe("delete", () => {
    it("should delete a comment", async () => {
      const task = await ctx.createTask({ title: "Test Task" });
      const created = await ctx.createComment({
        taskId: task.id,
        author: "tester",
        content: "To delete",
      });
      await ctx.deleteComment(created.id);

      const comment = await ctx.getComment(created.id);
      expect(comment).toBeUndefined();
    });

    it("should fail for non-existent comment", async () => {
      await expect(ctx.deleteComment("CMT-999"))
        .rejects.toThrow(/not found/i);
    });
  });
});
