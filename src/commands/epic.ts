import plur from 'plur';
import { Command } from 'commander';
import { EpicService } from '@/src/services/epic';
import { Validator } from '@/src/utils/validator';
import { Output } from '@/src/utils/output';
import type { EpicCreateOptions, EpicListOptions, EpicUpdateOptions } from '@/src/types/options';

abstract class EpicInputs {
  static fields(options: EpicUpdateOptions) {
    return {
      title: options.title,
      description: options.description,
      priority: Validator.parsePriority(options.priority),
      status: Validator.parseEpicStatus(options.status),
    };
  }
}

export const epicCommand = new Command('epic').description('Manage epics');

epicCommand
  .command('create')
  .description('Create a new epic')
  .requiredOption('-t, --title <title>', 'Epic title')
  .option('-d, --description <description>', 'Epic description')
  .option('-p, --priority <priority>', 'Priority (0-5, default: 2)')
  .option('-s, --status <status>', 'Status (todo, in_progress, completed, archived)')
  .action((options: EpicCreateOptions) => {
    try {
      Validator.validateRequired(options.title, 'Title');

      const epic = EpicService.createEpic({ ...EpicInputs.fields(options), title: options.title });

      Output.outputResult(epic, Output.formatEpic, `Epic created: ${epic.id}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

epicCommand
  .command('list')
  .description('List all epics')
  .option('-s, --status <status>', 'Filter by status')
  .option('--limit <n>', 'Results per page (default: 50)', '50')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .action((options: EpicListOptions) => {
    try {
      const status = Validator.parseEpicStatus(options.status);
      const { limit, page } = Validator.parsePaginationOptions(options);

      const result = EpicService.listEpics({ status, limit, page });

      Output.outputResult(result, Output.formatPaginatedEpicList);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

epicCommand
  .command('show <epic-id>')
  .description('Show epic details')
  .action((epicId: string) => {
    try {
      const epic = EpicService.getEpic(epicId);
      if (!epic) {
        return Output.handleNotFound('Epic', epicId);
      }

      Output.outputResult(epic, Output.formatEpic);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

epicCommand
  .command('update <epic-id>')
  .description('Update an epic')
  .option('-t, --title <title>', 'New title')
  .option('-d, --description <description>', 'New description')
  .option('-p, --priority <priority>', 'New priority (0-5)')
  .option('-s, --status <status>', 'New status')
  .action((epicId: string, options: EpicUpdateOptions) => {
    try {
      const epic = EpicService.updateEpic(epicId, EpicInputs.fields(options));

      Output.outputResult(epic, Output.formatEpic, `Epic updated: ${epic.id}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

epicCommand
  .command('delete <epic-id>')
  .description('Delete an epic')
  .action((epicId: string) => {
    try {
      EpicService.deleteEpic(epicId);
      Output.success(`Epic deleted: ${epicId}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

epicCommand
  .command('complete <epic-id>')
  .description('Complete an epic and archive all its tasks and subtasks')
  .action((epicId: string) => {
    try {
      const result = EpicService.completeEpic(epicId);

      if (Output.isToonMode()) {
        Output.print(result);
      } else {
        Output.success(`Epic completed: ${result.epic}`);
        console.log(
          `Archived ${result.archived.tasks} ${plur('task', result.archived.tasks)} and ${result.archived.subtasks} ${plur('subtask', result.archived.subtasks)}`
        );
      }
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
