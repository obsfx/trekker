import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServiceContext, initTrekkerService, type ServiceContext } from "../helpers/service-context";

describe("workflow integration tests (in-process)", () => {
  let ctx: ServiceContext;

  beforeEach(async () => {
    ctx = createServiceContext();
    await initTrekkerService(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("full task lifecycle", () => {
    it("should handle create -> update -> comment -> complete workflow", async () => {
      // Create task
      const task = await ctx.createTask({ title: "Implement login", description: "Build the login page" });
      expect(task.status).toBe("todo");

      // Start working
      const inProgress = await ctx.updateTask(task.id, { status: "in_progress" });
      expect(inProgress.status).toBe("in_progress");

      // Add progress comment
      await ctx.createComment({ taskId: task.id, author: "agent", content: "Started working on the form components" });

      // Add completion comment
      await ctx.createComment({ taskId: task.id, author: "agent", content: "Completed: Login form with validation implemented" });

      // Complete task
      const completed = await ctx.updateTask(task.id, { status: "completed" });
      expect(completed.status).toBe("completed");

      // Verify comments
      const comments = await ctx.listComments(task.id);
      expect(comments).toHaveLength(2);
    });

    it("should track all operations in history", async () => {
      const task = await ctx.createTask({ title: "Test history" });
      await ctx.updateTask(task.id, { status: "in_progress" });
      await ctx.updateTask(task.id, { status: "completed" });

      const history = await ctx.getHistory({ entityId: task.id });

      expect(history.events.some(e => e.action === "create")).toBe(true);
      expect(history.events.filter(e => e.action === "update").length).toBe(2);
    });
  });

  describe("epic workflow", () => {
    it("should complete epic and archive all tasks and subtasks", async () => {
      // Create epic with tasks and subtasks
      const epic = await ctx.createEpic({ title: "Authentication Feature" });

      const task1 = await ctx.createTask({ title: "Design auth flow", epicId: epic.id });
      const task2 = await ctx.createTask({ title: "Implement auth", epicId: epic.id });

      await ctx.createSubtask(task2.id, { title: "Create login form" });
      await ctx.createSubtask(task2.id, { title: "Add validation" });

      // Complete the epic
      const result = await ctx.completeEpic(epic.id);

      expect(result.archived.tasks).toBe(2);
      expect(result.archived.subtasks).toBe(2);

      // Verify tasks are archived
      const archivedTasks = await ctx.listAll({ types: ["task"], statuses: ["archived"] });
      expect(archivedTasks.total).toBe(2);

      // Verify subtasks are archived
      const archivedSubtasks = await ctx.listAll({ types: ["subtask"], statuses: ["archived"] });
      expect(archivedSubtasks.total).toBe(2);
    });

    it("should allow tasks to be assigned and reassigned to epics", async () => {
      const epic1 = await ctx.createEpic({ title: "Epic 1" });
      const epic2 = await ctx.createEpic({ title: "Epic 2" });

      // Create task in epic 1
      const task = await ctx.createTask({ title: "Movable task", epicId: epic1.id });
      expect(task.epicId).toBe(epic1.id);

      // Move to epic 2
      const moved = await ctx.updateTask(task.id, { epicId: epic2.id });
      expect(moved.epicId).toBe(epic2.id);

      // Remove from any epic
      const noEpic = await ctx.updateTask(task.id, { epicId: null });
      expect(noEpic.epicId).toBeNull();
    });
  });

  describe("dependency management", () => {
    it("should prevent circular dependencies", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      const task2 = await ctx.createTask({ title: "Task 2" });
      const task3 = await ctx.createTask({ title: "Task 3" });

      // Create chain: task3 -> task2 -> task1
      await ctx.addDependency(task2.id, task1.id);
      await ctx.addDependency(task3.id, task2.id);

      // Attempt to create circular: task1 -> task3 should fail
      await expect(ctx.addDependency(task1.id, task3.id))
        .rejects.toThrow(/cycle/i);
    });

    it("should track blockers correctly", async () => {
      const blocker = await ctx.createTask({ title: "Blocker task" });
      const blocked1 = await ctx.createTask({ title: "Blocked task 1" });
      const blocked2 = await ctx.createTask({ title: "Blocked task 2" });

      await ctx.addDependency(blocked1.id, blocker.id);
      await ctx.addDependency(blocked2.id, blocker.id);

      const deps = await ctx.getDependencies(blocker.id);
      expect(deps.blocks).toHaveLength(2);
    });
  });

  describe("search functionality", () => {
    it("should find entities across all types", async () => {
      const epic = await ctx.createEpic({ title: "Authentication Epic", description: "User auth feature" });
      const task = await ctx.createTask({ title: "Auth task", description: "Implement authentication", epicId: epic.id });
      await ctx.createSubtask(task.id, { title: "Auth subtask component" });
      await ctx.createComment({ taskId: task.id, author: "agent", content: "Authentication needs OAuth" });

      // Search for "authentication" (full word for FTS5)
      const result = await ctx.search("authentication");

      // Should find at least epic
      expect(result.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe("history tracking", () => {
    it("should track complete entity lifecycle", async () => {
      // Create
      const task = await ctx.createTask({ title: "Lifecycle task" });

      // Update multiple times
      await ctx.updateTask(task.id, { status: "in_progress" });
      await ctx.updateTask(task.id, { title: "Updated title" });
      await ctx.updateTask(task.id, { priority: 1 });

      // Delete
      await ctx.deleteTask(task.id);

      // Check history
      const history = await ctx.getHistory({ entityId: task.id });

      expect(history.events.filter(e => e.action === "create").length).toBe(1);
      expect(history.events.filter(e => e.action === "update").length).toBe(3);
      expect(history.events.filter(e => e.action === "delete").length).toBe(1);
    });

    it("should track dependency operations", async () => {
      const task1 = await ctx.createTask({ title: "Task 1" });
      const task2 = await ctx.createTask({ title: "Task 2" });

      await ctx.addDependency(task2.id, task1.id);
      await ctx.removeDependency(task2.id, task1.id);

      const history = await ctx.getHistory({ types: ["dependency"] });

      expect(history.events.some(e => e.action === "create")).toBe(true);
      expect(history.events.some(e => e.action === "delete")).toBe(true);
    });
  });

  describe("list and filter integration", () => {
    it("should filter by multiple criteria", async () => {
      const epic = await ctx.createEpic({ title: "Test Epic" });

      await ctx.createTask({ title: "High priority todo", priority: 1, status: "todo", epicId: epic.id });
      await ctx.createTask({ title: "Low priority todo", priority: 3, status: "todo", epicId: epic.id });
      await ctx.createTask({ title: "High priority done", priority: 1, status: "completed", epicId: epic.id });
      await ctx.createTask({ title: "Unrelated task", priority: 1, status: "todo" });

      // Filter by type, status, and priority
      const result = await ctx.listAll({ types: ["task"], statuses: ["todo"], priorities: [1] });

      expect(result.total).toBe(2); // Both high priority todo tasks
    });

    it("should sort and paginate correctly", async () => {
      for (let i = 1; i <= 15; i++) {
        await ctx.createTask({ title: `Task ${i.toString().padStart(2, "0")}`, priority: (i % 3) as 0 | 1 | 2 });
      }

      const page1 = await ctx.listAll({ types: ["task"], sort: [{ field: "priority", direction: "asc" }], limit: 5, page: 1 });
      const page2 = await ctx.listAll({ types: ["task"], sort: [{ field: "priority", direction: "asc" }], limit: 5, page: 2 });

      expect(page1.items).toHaveLength(5);
      expect(page2.items).toHaveLength(5);
      expect(page1.items[0].id).not.toBe(page2.items[0].id);
    });
  });

  describe("data integrity", () => {
    it("should maintain consistent state after multiple operations", async () => {
      // Create complex structure
      const epic = await ctx.createEpic({ title: "Complex Epic" });

      const tasks = [];
      for (let i = 1; i <= 5; i++) {
        const task = await ctx.createTask({ title: `Task ${i}`, epicId: epic.id });
        tasks.push(task);

        for (let j = 1; j <= 2; j++) {
          await ctx.createSubtask(task.id, { title: `Subtask ${i}.${j}` });
        }

        await ctx.createComment({ taskId: task.id, author: "agent", content: `Comment on task ${i}` });
      }

      // Add some dependencies
      await ctx.addDependency(tasks[1].id, tasks[0].id);
      await ctx.addDependency(tasks[2].id, tasks[1].id);

      // Update some tasks
      await ctx.updateTask(tasks[0].id, { status: "completed" });
      await ctx.updateTask(tasks[1].id, { status: "in_progress" });

      // Verify counts
      const allItems = await ctx.listAll();
      expect(allItems.total).toBe(1 + 5 + 10); // 1 epic + 5 tasks + 10 subtasks

      const epicTasks = await ctx.listTasks({ epicId: epic.id, parentTaskId: null });
      expect(epicTasks).toHaveLength(5);

      // Verify dependencies
      const deps = await ctx.getDependencies(tasks[1].id);
      expect(deps.dependsOn).toHaveLength(1);
      expect(deps.blocks).toHaveLength(1);
    });
  });
});
