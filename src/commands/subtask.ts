import { Command } from 'commander';
import { TaskService } from '@/src/services/task';
import { Validator } from '@/src/utils/validator';
import { Output } from '@/src/utils/output';
import { TaskInputs } from '@/src/commands/task-inputs';
import type {
  SubtaskCreateOptions,
  SubtaskUpdateOptions,
  PaginationOptions,
} from '@/src/types/options';

abstract class SubtaskGuards {
  static requireSubtask(subtaskId: string, command: 'update' | 'delete'): void {
    const subtask = TaskService.getTask(subtaskId);
    if (!subtask) {
      Output.handleNotFound('Subtask', subtaskId);
    }
    if (!subtask.parentTaskId) {
      Output.error(`${subtaskId} is not a subtask. Use 'trekker task ${command}' instead.`);
      process.exit(1);
    }
  }
}

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
      Validator.validateRequired(options.title, 'Title');

      const parent = TaskService.getTask(parentTaskId);
      if (!parent) {
        return Output.handleNotFound('Parent task', parentTaskId);
      }

      const subtask = TaskService.createTask({
        title: options.title,
        description: options.description,
        priority: Validator.parsePriority(options.priority),
        status: Validator.parseTaskStatus(options.status),
        parentTaskId,
        epicId: parent.epicId ?? undefined,
      });

      Output.outputResult(subtask, Output.formatTask, `Subtask created: ${subtask.id}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

subtaskCommand
  .command('list <parent-task-id>')
  .description('List all subtasks of a task')
  .option('--limit <n>', 'Results per page (default: 50)', '50')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .action((parentTaskId: string, options: PaginationOptions) => {
    try {
      const parent = TaskService.getTask(parentTaskId);
      if (!parent) {
        return Output.handleNotFound('Parent task', parentTaskId);
      }

      const { limit, page } = Validator.parsePaginationOptions(options);

      const result = TaskService.listSubtasks(parentTaskId, { limit, page });

      Output.outputResult(result, Output.formatPaginatedTaskList);
    } catch (err) {
      Output.handleCommandError(err);
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
      SubtaskGuards.requireSubtask(subtaskId, 'update');

      const updateInput = TaskInputs.update(options);

      const updated = TaskService.updateTask(subtaskId, updateInput);
      Output.outputResult(updated, Output.formatTask, `Subtask updated: ${updated.id}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

subtaskCommand
  .command('delete <subtask-id>')
  .description('Delete a subtask')
  .action((subtaskId: string) => {
    try {
      SubtaskGuards.requireSubtask(subtaskId, 'delete');

      TaskService.deleteTask(subtaskId);
      Output.success(`Subtask deleted: ${subtaskId}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
