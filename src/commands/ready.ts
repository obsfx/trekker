import plur from 'plur';
import { Command } from 'commander';
import { ReadyService } from '@/src/services/ready';
import type { ReadyTask } from '@/src/services/ready';
import { Output } from '@/src/utils/output';
import { Validator } from '@/src/utils/validator';
import { STATUS_PAD_WIDTH } from '@/src/utils/constants';
import type { PaginatedResponse } from '@/src/types';
import type { ReadyCommandOptions } from '@/src/types/options';

abstract class ReadyOutput {
  static readonly formatReadyTasks = (result: PaginatedResponse<ReadyTask>): string => {
    if (result.items.length === 0) {
      return 'No ready tasks found.';
    }

    const lines: string[] = [];
    lines.push(
      `${result.total} ready ${plur('task', result.total)} (page ${result.page}, ${result.limit} per page)\n`
    );

    for (const task of result.items) {
      let epic = '';
      if (task.epicId) {
        epic = ` (${task.epicId})`;
      }
      let tags = '';
      if (task.tags) {
        tags = ` [${task.tags}]`;
      }
      lines.push(`${task.id} | P${task.priority} | ${task.title}${epic}${tags}`);

      if (task.dependents.length > 0) {
        for (const dep of task.dependents) {
          lines.push(
            `  -> unblocks ${dep.id} | ${dep.status.padEnd(STATUS_PAD_WIDTH)} | P${dep.priority} | ${dep.title}`
          );
        }
      }
    }

    const pageLine = Output.pageLine(result.total, result.page, result.limit);
    if (pageLine !== null) {
      lines.push(`\n${pageLine}`);
    }

    return lines.join('\n');
  };
}

export const readyCommand = new Command('ready')
  .description('Show tasks that are ready to work on (unblocked, todo)')
  .option('--limit <n>', 'Results per page (default: 50)', '50')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .action((options: ReadyCommandOptions) => {
    try {
      const { limit, page } = Validator.parsePaginationOptions(options);

      const result = ReadyService.getReadyTasks({ limit, page });
      Output.outputResult(result, ReadyOutput.formatReadyTasks);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
