import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createTestContext, initTrekker, type TestContext } from "../helpers/test-context";

interface Task {
  id: string;
  title: string;
}

interface Comment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

describe("comment command", () => {
  let ctx: TestContext;
  let task: Task;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
    task = ctx.runToon<Task>('task create -t "Test Task"');
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("add", () => {
    it("should add a comment to a task", () => {
      const comment = ctx.runToon<Comment>(`comment add ${task.id} -a "agent" -c "Test comment"`);

      expect(comment.id).toMatch(/^CMT-\d+$/);
      expect(comment.taskId).toBe(task.id);
      expect(comment.author).toBe("agent");
      expect(comment.content).toBe("Test comment");
    });

    it("should add multiple comments to the same task", () => {
      ctx.run(`comment add ${task.id} -a "agent1" -c "Comment 1"`);
      ctx.run(`comment add ${task.id} -a "agent2" -c "Comment 2"`);
      ctx.run(`comment add ${task.id} -a "agent3" -c "Comment 3"`);

      const comments = ctx.runToon<Comment[]>(`comment list ${task.id}`);
      expect(comments).toHaveLength(3);
    });

    it("should fail without author", () => {
      const error = ctx.runExpectError(`comment add ${task.id} -c "Test"`);
      expect(error).toContain("required");
    });

    it("should fail without content", () => {
      const error = ctx.runExpectError(`comment add ${task.id} -a "agent"`);
      expect(error).toContain("required");
    });

    it("should fail with non-existent task", () => {
      const error = ctx.runExpectError('comment add TREK-999 -a "agent" -c "Test"');
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should handle multiline content", () => {
      const comment = ctx.runToon<Comment>(`comment add ${task.id} -a "agent" -c "Line 1\\nLine 2\\nLine 3"`);
      expect(comment.content).toContain("Line 1");
    });
  });

  describe("list", () => {
    it("should list all comments on a task", () => {
      ctx.run(`comment add ${task.id} -a "agent" -c "Comment 1"`);
      ctx.run(`comment add ${task.id} -a "agent" -c "Comment 2"`);
      ctx.run(`comment add ${task.id} -a "agent" -c "Comment 3"`);

      const comments = ctx.runToon<Comment[]>(`comment list ${task.id}`);
      expect(comments).toHaveLength(3);
    });

    it("should return empty array when no comments", () => {
      const comments = ctx.runToon<Comment[]>(`comment list ${task.id}`);
      expect(comments).toHaveLength(0);
    });

    it("should only list comments on specified task", () => {
      const otherTask = ctx.runToon<Task>('task create -t "Other Task"');

      ctx.run(`comment add ${task.id} -a "agent" -c "Comment on task 1"`);
      ctx.run(`comment add ${otherTask.id} -a "agent" -c "Comment on task 2"`);

      const comments = ctx.runToon<Comment[]>(`comment list ${task.id}`);
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe("Comment on task 1");
    });
  });

  describe("update", () => {
    it("should update comment content", () => {
      const comment = ctx.runToon<Comment>(`comment add ${task.id} -a "agent" -c "Original"`);
      const updated = ctx.runToon<Comment>(`comment update ${comment.id} -c "Updated content"`);

      expect(updated.id).toBe(comment.id);
      expect(updated.content).toBe("Updated content");
      expect(updated.author).toBe("agent"); // author should remain unchanged
    });

    it("should fail without content", () => {
      const comment = ctx.runToon<Comment>(`comment add ${task.id} -a "agent" -c "Test"`);
      const error = ctx.runExpectError(`comment update ${comment.id}`);
      expect(error).toContain("required");
    });

    it("should fail for non-existent comment", () => {
      const error = ctx.runExpectError('comment update CMT-999 -c "Test"');
      expect(error.toLowerCase()).toContain("not found");
    });
  });

  describe("delete", () => {
    it("should delete a comment", () => {
      const comment = ctx.runToon<Comment>(`comment add ${task.id} -a "agent" -c "To Delete"`);
      const output = ctx.run(`comment delete ${comment.id}`);

      expect(output.toLowerCase()).toContain("deleted");

      const comments = ctx.runToon<Comment[]>(`comment list ${task.id}`);
      expect(comments).toHaveLength(0);
    });

    it("should fail for non-existent comment", () => {
      const error = ctx.runExpectError("comment delete CMT-999");
      expect(error.toLowerCase()).toContain("not found");
    });

    it("should only delete specified comment", () => {
      const comment1 = ctx.runToon<Comment>(`comment add ${task.id} -a "agent" -c "Comment 1"`);
      ctx.run(`comment add ${task.id} -a "agent" -c "Comment 2"`);

      ctx.run(`comment delete ${comment1.id}`);

      const comments = ctx.runToon<Comment[]>(`comment list ${task.id}`);
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe("Comment 2");
    });
  });
});
