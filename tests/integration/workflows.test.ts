import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createTestContext, initTrekker, type TestContext } from "../helpers/test-context";

interface Epic {
  id: string;
  title: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  epicId: string | null;
  parentTaskId: string | null;
}

interface Comment {
  id: string;
  taskId: string;
  content: string;
}

interface DependencyItem {
  taskId: string;
  dependsOnId: string;
}

interface DependencyList {
  dependsOn: DependencyItem[];
  blocks: DependencyItem[];
}

interface HistoryResponse {
  events: Array<{
    entityId: string;
    action: string;
    entityType: string;
  }>;
}

interface SearchResponse {
  total: number;
  results: Array<{ id: string }>;
}

interface ListResponse {
  total: number;
  items: Array<{ id: string; status: string }>;
}

describe("workflow integration tests", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("full task lifecycle", () => {
    it("should handle create -> update -> comment -> complete workflow", () => {
      // Create task
      const task = ctx.runToon<Task>('task create -t "Implement login" -d "Build the login page"');
      expect(task.status).toBe("todo");

      // Start working
      const inProgress = ctx.runToon<Task>(`task update ${task.id} -s in_progress`);
      expect(inProgress.status).toBe("in_progress");

      // Add progress comment
      ctx.run(`comment add ${task.id} -a "agent" -c "Started working on the form components"`);

      // Add completion comment
      ctx.run(`comment add ${task.id} -a "agent" -c "Completed: Login form with validation implemented"`);

      // Complete task
      const completed = ctx.runToon<Task>(`task update ${task.id} -s completed`);
      expect(completed.status).toBe("completed");

      // Verify comments
      const comments = ctx.runToon<Comment[]>(`comment list ${task.id}`);
      expect(comments).toHaveLength(2);
    });

    it("should track all operations in history", () => {
      const task = ctx.runToon<Task>('task create -t "Test history"');
      ctx.run(`task update ${task.id} -s in_progress`);
      ctx.run(`task update ${task.id} -s completed`);

      const history = ctx.runToon<HistoryResponse>(`history --entity ${task.id}`);

      expect(history.events.some(e => e.action === "create")).toBe(true);
      expect(history.events.filter(e => e.action === "update").length).toBe(2);
    });
  });

  describe("epic workflow", () => {
    it("should complete epic and archive all tasks and subtasks", () => {
      // Create epic with tasks and subtasks
      const epic = ctx.runToon<Epic>('epic create -t "Authentication Feature"');

      const task1 = ctx.runToon<Task>(`task create -t "Design auth flow" -e ${epic.id}`);
      const task2 = ctx.runToon<Task>(`task create -t "Implement auth" -e ${epic.id}`);

      ctx.run(`subtask create ${task2.id} -t "Create login form"`);
      ctx.run(`subtask create ${task2.id} -t "Add validation"`);

      // Complete the epic
      const result = ctx.runToon<{ epic: string; archived: { tasks: number; subtasks: number } }>(`epic complete ${epic.id}`);

      expect(result.archived.tasks).toBe(2);
      expect(result.archived.subtasks).toBe(2);

      // Verify tasks are archived
      const archivedTasks = ctx.runToon<ListResponse>(`list --type task --status archived`);
      expect(archivedTasks.total).toBe(2);

      // Verify subtasks are archived
      const archivedSubtasks = ctx.runToon<ListResponse>(`list --type subtask --status archived`);
      expect(archivedSubtasks.total).toBe(2);
    });

    it("should allow tasks to be assigned and reassigned to epics", () => {
      const epic1 = ctx.runToon<Epic>('epic create -t "Epic 1"');
      const epic2 = ctx.runToon<Epic>('epic create -t "Epic 2"');

      // Create task in epic 1
      const task = ctx.runToon<Task>(`task create -t "Movable task" -e ${epic1.id}`);
      expect(task.epicId).toBe(epic1.id);

      // Move to epic 2
      const moved = ctx.runToon<Task>(`task update ${task.id} -e ${epic2.id}`);
      expect(moved.epicId).toBe(epic2.id);

      // Remove from any epic
      const noEpic = ctx.runToon<Task>(`task update ${task.id} --no-epic`);
      expect(noEpic.epicId).toBeNull();
    });
  });

  describe("dependency management", () => {
    it("should prevent circular dependencies", () => {
      const task1 = ctx.runToon<Task>('task create -t "Task 1"');
      const task2 = ctx.runToon<Task>('task create -t "Task 2"');
      const task3 = ctx.runToon<Task>('task create -t "Task 3"');

      // Create chain: task3 -> task2 -> task1
      ctx.run(`dep add ${task2.id} ${task1.id}`);
      ctx.run(`dep add ${task3.id} ${task2.id}`);

      // Attempt to create circular: task1 -> task3 should fail
      const error = ctx.runExpectError(`dep add ${task1.id} ${task3.id}`);
      expect(error.toLowerCase()).toContain("cycle");
    });

    it("should track blockers correctly", () => {
      const blocker = ctx.runToon<Task>('task create -t "Blocker task"');
      const blocked1 = ctx.runToon<Task>('task create -t "Blocked task 1"');
      const blocked2 = ctx.runToon<Task>('task create -t "Blocked task 2"');

      ctx.run(`dep add ${blocked1.id} ${blocker.id}`);
      ctx.run(`dep add ${blocked2.id} ${blocker.id}`);

      const deps = ctx.runToon<DependencyList>(`dep list ${blocker.id}`);
      expect(deps.blocks).toHaveLength(2);
    });
  });

  describe("search functionality", () => {
    it("should find entities across all types", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Authentication Epic" -d "User auth feature"');
      const task = ctx.runToon<Task>(`task create -t "Auth task" -d "Implement authentication" -e ${epic.id}`);
      ctx.run(`subtask create ${task.id} -t "Auth subtask component"`);
      ctx.run(`comment add ${task.id} -a "agent" -c "Authentication needs OAuth"`);

      const result = ctx.runToon<SearchResponse>("search auth");

      // Should find at least epic, task, and subtask (comment may or may not match depending on search implementation)
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it("should search after index rebuild", () => {
      ctx.run('task create -t "Searchable task"');

      const result = ctx.runToon<SearchResponse>("search searchable --rebuild-index");
      expect(result.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe("history tracking", () => {
    it("should track complete entity lifecycle", () => {
      // Create
      const task = ctx.runToon<Task>('task create -t "Lifecycle task"');

      // Update multiple times
      ctx.run(`task update ${task.id} -s in_progress`);
      ctx.run(`task update ${task.id} -t "Updated title"`);
      ctx.run(`task update ${task.id} -p 1`);

      // Delete
      ctx.run(`task delete ${task.id}`);

      // Check history
      const history = ctx.runToon<HistoryResponse>(`history --entity ${task.id}`);

      expect(history.events.filter(e => e.action === "create").length).toBe(1);
      expect(history.events.filter(e => e.action === "update").length).toBe(3);
      expect(history.events.filter(e => e.action === "delete").length).toBe(1);
    });

    it("should track dependency operations", () => {
      const task1 = ctx.runToon<Task>('task create -t "Task 1"');
      const task2 = ctx.runToon<Task>('task create -t "Task 2"');

      ctx.run(`dep add ${task2.id} ${task1.id}`);
      ctx.run(`dep remove ${task2.id} ${task1.id}`);

      const history = ctx.runToon<HistoryResponse>("history --type dependency");

      expect(history.events.some(e => e.action === "create")).toBe(true);
      expect(history.events.some(e => e.action === "delete")).toBe(true);
    });
  });

  describe("list and filter integration", () => {
    it("should filter by multiple criteria", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic"');

      ctx.run(`task create -t "High priority todo" -p 1 -s todo -e ${epic.id}`);
      ctx.run(`task create -t "Low priority todo" -p 3 -s todo -e ${epic.id}`);
      ctx.run(`task create -t "High priority done" -p 1 -s completed -e ${epic.id}`);
      ctx.run('task create -t "Unrelated task" -p 1 -s todo');

      // Filter by type, status, and priority
      const result = ctx.runToon<ListResponse>("list --type task --status todo --priority 1");

      expect(result.total).toBe(2); // Both high priority todo tasks
    });

    it("should sort and paginate correctly", () => {
      for (let i = 1; i <= 15; i++) {
        ctx.run(`task create -t "Task ${i.toString().padStart(2, "0")}" -p ${i % 3}`);
      }

      const page1 = ctx.runToon<ListResponse>("list --type task --sort priority:asc --limit 5 --page 1");
      const page2 = ctx.runToon<ListResponse>("list --type task --sort priority:asc --limit 5 --page 2");

      expect(page1.items).toHaveLength(5);
      expect(page2.items).toHaveLength(5);
      expect(page1.items[0].id).not.toBe(page2.items[0].id);
    });
  });

  describe("subtask inheritance", () => {
    it("should inherit epic from parent task", () => {
      const epic = ctx.runToon<Epic>('epic create -t "Test Epic"');
      const task = ctx.runToon<Task>(`task create -t "Parent task" -e ${epic.id}`);
      const subtask = ctx.runToon<Task>(`subtask create ${task.id} -t "Child subtask"`);

      expect(subtask.epicId).toBe(epic.id);
    });
  });

  describe("data integrity", () => {
    it("should maintain consistent state after multiple operations", () => {
      // Create complex structure
      const epic = ctx.runToon<Epic>('epic create -t "Complex Epic"');

      const tasks: Task[] = [];
      for (let i = 1; i <= 5; i++) {
        const task = ctx.runToon<Task>(`task create -t "Task ${i}" -e ${epic.id}`);
        tasks.push(task);

        for (let j = 1; j <= 2; j++) {
          ctx.run(`subtask create ${task.id} -t "Subtask ${i}.${j}"`);
        }

        ctx.run(`comment add ${task.id} -a "agent" -c "Comment on task ${i}"`);
      }

      // Add some dependencies
      ctx.run(`dep add ${tasks[1].id} ${tasks[0].id}`);
      ctx.run(`dep add ${tasks[2].id} ${tasks[1].id}`);

      // Update some tasks
      ctx.run(`task update ${tasks[0].id} -s completed`);
      ctx.run(`task update ${tasks[1].id} -s in_progress`);

      // Verify counts
      const allItems = ctx.runToon<ListResponse>("list");
      expect(allItems.total).toBe(1 + 5 + 10); // 1 epic + 5 tasks + 10 subtasks

      const epicTasks = ctx.runToon<Task[]>(`task list -e ${epic.id}`);
      expect(epicTasks).toHaveLength(5);

      // Verify dependencies
      const deps = ctx.runToon<DependencyList>(`dep list ${tasks[1].id}`);
      expect(deps.dependsOn).toHaveLength(1);
      expect(deps.blocks).toHaveLength(1);
    });
  });
});
