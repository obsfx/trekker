import { Command } from 'commander';
import { getReadyTasks } from '../services/ready';
import type { ReadyTask } from '../services/ready';
import { handleCommandError, outputResult } from '../utils/output';
import { parsePaginationOptions } from '../utils/validator';
import { STATUS_PAD_WIDTH } from '../utils/constants';
import type { PaginatedResponse } from '../types';
import type { ReadyCommandOptions } from '../types/options';

export const readyCommand = new Command('ready')
  .description('Show tasks that are ready to work on (unblocked, todo)')
  .option('--limit <n>', 'Results per page (default: 50)', '50')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .action((options: ReadyCommandOptions) => {
    try {
      const { limit, page } = parsePaginationOptions(options);

      const result = getReadyTasks({ limit, page });
      outputResult(result, formatReadyTasks);
    } catch (err) {
      handleCommandError(err);
    }
  });

function formatReadyTasks(result: PaginatedResponse<ReadyTask>): string {
  if (result.items.length === 0) {
    return 'No ready tasks found.';
  }

  const lines: string[] = [];
  lines.push(`${result.total} ready task(s) (page ${result.page}, ${result.limit} per page)\n`);

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

  const totalPages = Math.ceil(result.total / result.limit);
  if (totalPages > 1) {
    lines.push(`\nPage ${result.page} of ${totalPages}`);
  }

  return lines.join('\n');
}
