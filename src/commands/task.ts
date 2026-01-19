import { Command } from "commander";
import {
  createTask,
  getTask,
  listTasks,
  updateTask,
  deleteTask,
} from "../services/task";
import { parseStatus, parsePriority, validateRequired } from "../utils/validator";
import {
  success,
  error,
  output,
  formatTask,
  formatTaskList,
  isJsonMode,
} from "../utils/output";
import type { TaskStatus } from "../types";

export const taskCommand = new Command("task").description("Manage tasks");

taskCommand
  .command("create")
  .description("Create a new task")
  .requiredOption("-t, --title <title>", "Task title")
  .option("-d, --description <description>", "Task description")
  .option("-p, --priority <priority>", "Priority (0-5, default: 2)")
  .option("-s, --status <status>", "Status (todo, in_progress, completed, wont_fix, archived)")
  .option("--tags <tags>", "Comma-separated tags")
  .option("-e, --epic <epic-id>", "Epic ID to assign task to")
  .action((options) => {
    try {
      validateRequired(options.title, "Title");

      const task = createTask({
        title: options.title,
        description: options.description,
        priority: parsePriority(options.priority),
        status: parseStatus(options.status, "task") as TaskStatus | undefined,
        tags: options.tags,
        epicId: options.epic,
      });

      if (isJsonMode()) {
        output(task);
      } else {
        success(`Task created: ${task.id}`);
        console.log(formatTask(task));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

taskCommand
  .command("list")
  .description("List all tasks")
  .option("-s, --status <status>", "Filter by status")
  .option("-e, --epic <epic-id>", "Filter by epic")
  .action((options) => {
    try {
      const status = parseStatus(options.status, "task") as TaskStatus | undefined;
      const tasks = listTasks({
        status,
        epicId: options.epic,
        parentTaskId: null, // Only list top-level tasks by default
      });

      if (isJsonMode()) {
        output(tasks);
      } else {
        console.log(formatTaskList(tasks));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

taskCommand
  .command("show <task-id>")
  .description("Show task details")
  .action((taskId) => {
    try {
      const task = getTask(taskId);

      if (!task) {
        error(`Task not found: ${taskId}`);
        process.exit(1);
      }

      if (isJsonMode()) {
        output(task);
      } else {
        console.log(formatTask(task));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

taskCommand
  .command("update <task-id>")
  .description("Update a task")
  .option("-t, --title <title>", "New title")
  .option("-d, --description <description>", "New description")
  .option("-p, --priority <priority>", "New priority (0-5)")
  .option("-s, --status <status>", "New status")
  .option("--tags <tags>", "New tags (comma-separated)")
  .option("-e, --epic <epic-id>", "New epic ID")
  .option("--no-epic", "Remove from epic")
  .action((taskId, options) => {
    try {
      const updateInput: Record<string, unknown> = {};

      if (options.title !== undefined) updateInput.title = options.title;
      if (options.description !== undefined) updateInput.description = options.description;
      if (options.priority !== undefined) updateInput.priority = parsePriority(options.priority);
      if (options.status !== undefined) {
        updateInput.status = parseStatus(options.status, "task");
      }
      if (options.tags !== undefined) updateInput.tags = options.tags;
      if (options.epic === false) {
        updateInput.epicId = null;
      } else if (options.epic !== undefined) {
        updateInput.epicId = options.epic;
      }

      const task = updateTask(taskId, updateInput);

      if (isJsonMode()) {
        output(task);
      } else {
        success(`Task updated: ${task.id}`);
        console.log(formatTask(task));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

taskCommand
  .command("delete <task-id>")
  .description("Delete a task")
  .action((taskId) => {
    try {
      deleteTask(taskId);
      success(`Task deleted: ${taskId}`);
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
