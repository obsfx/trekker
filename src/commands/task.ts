import { Command } from 'commander';
import { TaskService } from '@/src/services/task';
import { Validator } from '@/src/utils/validator';
import { Output } from '@/src/utils/output';
import { TaskInputs } from '@/src/commands/task-inputs';
import type { TaskCreateOptions, TaskListOptions, TaskUpdateOptions } from '@/src/types/options';

export const taskCommand = new Command('task').description('Manage tasks');

taskCommand
  .command('create')
  .description('Create a new task')
  .requiredOption('-t, --title <title>', 'Task title')
  .option('-d, --description <description>', 'Task description')
  .option('-p, --priority <priority>', 'Priority (0-5, default: 2)')
  .option('-s, --status <status>', 'Status (todo, in_progress, completed, wont_fix, archived)')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('-e, --epic <epic-id>', 'Epic ID to assign task to')
  .action((options: TaskCreateOptions) => {
    try {
      Validator.validateRequired(options.title, 'Title');

      const task = TaskService.createTask({
        title: options.title,
        description: options.description,
        priority: Validator.parsePriority(options.priority),
        status: Validator.parseTaskStatus(options.status),
        tags: options.tags,
        epicId: options.epic,
      });

      Output.outputResult(task, Output.formatTask, `Task created: ${task.id}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

taskCommand
  .command('list')
  .description('List all tasks')
  .option('-s, --status <status>', 'Filter by status')
  .option('-e, --epic <epic-id>', 'Filter by epic')
  .option('--limit <n>', 'Results per page (default: 50)', '50')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .action((options: TaskListOptions) => {
    try {
      const status = Validator.parseTaskStatus(options.status);
      const { limit, page } = Validator.parsePaginationOptions(options);

      const result = TaskService.listTasks({
        status,
        epicId: options.epic,
        parentTaskId: null,
        limit,
        page,
      });

      Output.outputResult(result, Output.formatPaginatedTaskList);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

taskCommand
  .command('show <task-id>')
  .description('Show task details')
  .action((taskId: string) => {
    try {
      const task = TaskService.getTask(taskId);
      if (!task) {
        return Output.handleNotFound('Task', taskId);
      }

      Output.outputResult(task, Output.formatTask);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

taskCommand
  .command('update <task-id>')
  .description('Update a task')
  .option('-t, --title <title>', 'New title')
  .option('-d, --description <description>', 'New description')
  .option('-p, --priority <priority>', 'New priority (0-5)')
  .option('-s, --status <status>', 'New status')
  .option('--tags <tags>', 'New tags (comma-separated)')
  .option('-e, --epic <epic-id>', 'New epic ID')
  .option('--no-epic', 'Remove from epic')
  .action((taskId: string, options: TaskUpdateOptions) => {
    try {
      const updateInput = TaskInputs.update(options);
      if (options.tags !== undefined) {
        updateInput.tags = options.tags;
      }
      if (options.epic === false) {
        updateInput.epicId = null;
      } else if (options.epic !== undefined) {
        updateInput.epicId = options.epic;
      }

      const task = TaskService.updateTask(taskId, updateInput);
      Output.outputResult(task, Output.formatTask, `Task updated: ${task.id}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

taskCommand
  .command('delete <task-id>')
  .description('Delete a task')
  .action((taskId: string) => {
    try {
      TaskService.deleteTask(taskId);
      Output.success(`Task deleted: ${taskId}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
