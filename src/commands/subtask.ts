import { Command } from "commander";
import {
  createTask,
  getTask,
  listSubtasks,
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
  isToonMode,
} from "../utils/output";
import type { TaskStatus } from "../types";

export const subtaskCommand = new Command("subtask").description(
  "Manage subtasks"
);

subtaskCommand
  .command("create <parent-task-id>")
  .description("Create a new subtask")
  .requiredOption("-t, --title <title>", "Subtask title")
  .option("-d, --description <description>", "Subtask description")
  .option("-p, --priority <priority>", "Priority (0-5, default: 2)")
  .option("-s, --status <status>", "Status (todo, in_progress, completed, wont_fix, archived)")
  .action((parentTaskId, options) => {
    try {
      validateRequired(options.title, "Title");

      // Validate parent task exists
      const parent = getTask(parentTaskId);
      if (!parent) {
        error(`Parent task not found: ${parentTaskId}`);
        process.exit(1);
      }

      const subtask = createTask({
        title: options.title,
        description: options.description,
        priority: parsePriority(options.priority),
        status: parseStatus(options.status, "task") as TaskStatus | undefined,
        parentTaskId,
        epicId: parent.epicId ?? undefined, // Inherit epic from parent
      });

      if (isToonMode()) {
        output(subtask);
      } else {
        success(`Subtask created: ${subtask.id}`);
        console.log(formatTask(subtask));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

subtaskCommand
  .command("list <parent-task-id>")
  .description("List all subtasks of a task")
  .action((parentTaskId) => {
    try {
      // Validate parent task exists
      const parent = getTask(parentTaskId);
      if (!parent) {
        error(`Parent task not found: ${parentTaskId}`);
        process.exit(1);
      }

      const subtasks = listSubtasks(parentTaskId);

      if (isToonMode()) {
        output(subtasks);
      } else {
        if (subtasks.length === 0) {
          console.log(`No subtasks for ${parentTaskId}`);
        } else {
          console.log(`Subtasks of ${parentTaskId}:`);
          console.log(formatTaskList(subtasks));
        }
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

subtaskCommand
  .command("update <subtask-id>")
  .description("Update a subtask")
  .option("-t, --title <title>", "New title")
  .option("-d, --description <description>", "New description")
  .option("-p, --priority <priority>", "New priority (0-5)")
  .option("-s, --status <status>", "New status")
  .action((subtaskId, options) => {
    try {
      const subtask = getTask(subtaskId);
      if (!subtask) {
        error(`Subtask not found: ${subtaskId}`);
        process.exit(1);
      }

      if (!subtask.parentTaskId) {
        error(`${subtaskId} is not a subtask. Use 'trekker task update' instead.`);
        process.exit(1);
      }

      const updateInput: Record<string, unknown> = {};

      if (options.title !== undefined) updateInput.title = options.title;
      if (options.description !== undefined) updateInput.description = options.description;
      if (options.priority !== undefined) updateInput.priority = parsePriority(options.priority);
      if (options.status !== undefined) {
        updateInput.status = parseStatus(options.status, "task");
      }

      const updated = updateTask(subtaskId, updateInput);

      if (isToonMode()) {
        output(updated);
      } else {
        success(`Subtask updated: ${updated.id}`);
        console.log(formatTask(updated));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

subtaskCommand
  .command("delete <subtask-id>")
  .description("Delete a subtask")
  .action((subtaskId) => {
    try {
      const subtask = getTask(subtaskId);
      if (!subtask) {
        error(`Subtask not found: ${subtaskId}`);
        process.exit(1);
      }

      if (!subtask.parentTaskId) {
        error(`${subtaskId} is not a subtask. Use 'trekker task delete' instead.`);
        process.exit(1);
      }

      deleteTask(subtaskId);
      success(`Subtask deleted: ${subtaskId}`);
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
