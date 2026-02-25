import { Command } from 'commander';
import { createTask, getTask, listSubtasks, updateTask, deleteTask } from '../services/task';
import {
  parseStatus,
  parsePriority,
  validateRequired,
  parsePaginationOptions,
} from '../utils/validator';
import {
  success,
  error,
  formatTask,
  formatPaginatedTaskList,
  handleCommandError,
  handleNotFound,
  outputResult,
} from '../utils/output';
import type {
  SubtaskCreateOptions,
  SubtaskUpdateOptions,
  PaginationOptions,
} from '../types/options';

export const subtaskCommand = new Command('subtask').description('Manage subtasks');

subtaskCommand
  .command('create <parent-task-id>')
  .description('Create a new subtask')
  .requiredOption('-t, --title <title>', 'Subtask title')
  .option('-d, --description <description>', 'Subtask description')
  .option('-p, --priority <priority>', 'Priority (0-5, default: 2)')
  .option('-s, --status <status>', 'Status (todo, in_progress, completed, wont_fix, archived)')
  .action((parentTaskId: string, options: SubtaskCreateOptions) => {
    try {
      validateRequired(options.title, 'Title');

      const parent = getTask(parentTaskId);
      if (!parent) {
        return handleNotFound('Parent task', parentTaskId);
      }

      const subtask = createTask({
        title: options.title,
        description: options.description,
        priority: parsePriority(options.priority),
        status: parseStatus(options.status, 'task'),
        parentTaskId,
        epicId: parent.epicId ?? undefined,
      });

      outputResult(subtask, formatTask, `Subtask created: ${subtask.id}`);
    } catch (err) {
      handleCommandError(err);
    }
  });

subtaskCommand
  .command('list <parent-task-id>')
  .description('List all subtasks of a task')
  .option('--limit <n>', 'Results per page (default: 50)', '50')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .action((parentTaskId: string, options: PaginationOptions) => {
    try {
      const parent = getTask(parentTaskId);
      if (!parent) {
        return handleNotFound('Parent task', parentTaskId);
      }

      const { limit, page } = parsePaginationOptions(options);

      const result = listSubtasks(parentTaskId, { limit, page });

      outputResult(result, formatPaginatedTaskList);
    } catch (err) {
      handleCommandError(err);
    }
  });

subtaskCommand
  .command('update <subtask-id>')
  .description('Update a subtask')
  .option('-t, --title <title>', 'New title')
  .option('-d, --description <description>', 'New description')
  .option('-p, --priority <priority>', 'New priority (0-5)')
  .option('-s, --status <status>', 'New status')
  .action((subtaskId: string, options: SubtaskUpdateOptions) => {
    try {
      const subtask = getTask(subtaskId);
      if (!subtask) {
        return handleNotFound('Subtask', subtaskId);
      }

      if (!subtask.parentTaskId) {
        error(`${subtaskId} is not a subtask. Use 'trekker task update' instead.`);
        process.exit(1);
      }

      const updateInput: Record<string, unknown> = {};
      if (options.title !== undefined) {
        updateInput.title = options.title;
      }
      if (options.description !== undefined) {
        updateInput.description = options.description;
      }
      if (options.priority !== undefined) {
        updateInput.priority = parsePriority(options.priority);
      }
      if (options.status !== undefined) {
        updateInput.status = parseStatus(options.status, 'task');
      }

      const updated = updateTask(subtaskId, updateInput);
      outputResult(updated, formatTask, `Subtask updated: ${updated.id}`);
    } catch (err) {
      handleCommandError(err);
    }
  });

subtaskCommand
  .command('delete <subtask-id>')
  .description('Delete a subtask')
  .action((subtaskId: string) => {
    try {
      const subtask = getTask(subtaskId);
      if (!subtask) {
        return handleNotFound('Subtask', subtaskId);
      }

      if (!subtask.parentTaskId) {
        error(`${subtaskId} is not a subtask. Use 'trekker task delete' instead.`);
        process.exit(1);
      }

      deleteTask(subtaskId);
      success(`Subtask deleted: ${subtaskId}`);
    } catch (err) {
      handleCommandError(err);
    }
  });
