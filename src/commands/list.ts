import plur from 'plur';
import { Command } from 'commander';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ListService } from '@/src/services/list';
import type { ListEntityType, ListResponse, ListItem } from '@/src/services/list';
import { Output } from '@/src/utils/output';
import { Validator } from '@/src/utils/validator';
import { STATUS_PAD_WIDTH, TYPE_PAD_WIDTH, RADIX_DECIMAL } from '@/src/utils/constants';
import type { ListCommandOptions } from '@/src/types/options';

abstract class ListOutput {
  static parseDate(dateStr: string | undefined): Date | undefined {
    if (!dateStr) {
      return undefined;
    }
    const parsed = dayjs(dateStr, 'YYYY-MM-DD', true);
    if (parsed.isValid()) {
      return parsed.toDate();
    }
    return undefined;
  }

  static parseUntilDate(dateStr: string | undefined): Date | undefined {
    if (!dateStr) {
      return undefined;
    }
    const parsed = dayjs(dateStr, 'YYYY-MM-DD', true);
    if (parsed.isValid()) {
      return parsed.endOf('day').toDate();
    }
    return undefined;
  }

  static readonly formatListResults = (result: ListResponse): string => {
    const lines: string[] = [];

    lines.push(
      `Found ${result.total} ${plur('item', result.total)} (page ${result.page}, ${result.limit} per page)`
    );
    lines.push('');

    if (result.items.length === 0) {
      lines.push('No items found.');
      return lines.join('\n');
    }

    for (const item of result.items) {
      lines.push(ListOutput.formatItem(item));
    }

    const pageLine = Output.pageLine(result.total, result.page, result.limit);
    if (pageLine !== null) {
      lines.push('');
      lines.push(pageLine);
    }

    return lines.join('\n');
  };

  private static formatItem(item: ListItem): string {
    const typeLabel = item.type.toUpperCase().padEnd(TYPE_PAD_WIDTH);
    const statusLabel = item.status.padEnd(STATUS_PAD_WIDTH);
    const priorityLabel = `P${item.priority}`;
    let parentLabel = '';
    if (item.parentId) {
      parentLabel = ` (${item.parentId})`;
    }

    return `${typeLabel} ${item.id} | ${statusLabel} | ${priorityLabel} | ${item.title}${parentLabel}`;
  }
}

dayjs.extend(customParseFormat);

export const listCommand = new Command('list')
  .description('List all epics, tasks, and subtasks')
  .option('--type <types>', 'Filter by type: epic,task,subtask (comma-separated)')
  .option('--status <statuses>', 'Filter by status (comma-separated)')
  .option('--priority <levels>', 'Filter by priority: 0-5 (comma-separated)')
  .option('--since <date>', 'Created after date (YYYY-MM-DD)')
  .option('--until <date>', 'Created before date (YYYY-MM-DD)')
  .option('--sort <fields>', 'Sort by fields (field:direction, comma-separated)', 'created:desc')
  .option('--limit <n>', 'Results per page (default: 50)', '50')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .action((options: ListCommandOptions) => {
    try {
      const { limit, page } = Validator.parsePaginationOptions(options);

      const rawTypes = Validator.parseCommaSeparated(options.type);
      let types: ListEntityType[] | undefined;

      if (rawTypes) {
        Validator.validateListEntityTypes(rawTypes);
        types = rawTypes;
      }

      const statuses = Validator.parseCommaSeparated(options.status);

      let priorities: number[] | undefined;
      if (options.priority) {
        priorities = options.priority.split(',').map((p) => {
          return Number.parseInt(p.trim(), RADIX_DECIMAL);
        });
      }

      if (priorities) {
        Validator.validatePriorities(priorities);
      }

      let sort;
      try {
        sort = ListService.parseSort(options.sort);
      } catch (err) {
        if (err instanceof Error) {
          throw new Error(`Invalid sort: ${err.message}`, { cause: err });
        }
        throw new Error(`Invalid sort: ${String(err)}`, { cause: err });
      }

      const since = ListOutput.parseDate(options.since);
      if (options.since && !since) {
        throw new Error('Invalid since date. Use YYYY-MM-DD format.');
      }

      const until = ListOutput.parseUntilDate(options.until);
      if (options.until && !until) {
        throw new Error('Invalid until date. Use YYYY-MM-DD format.');
      }

      const result = ListService.listAll({
        types,
        statuses,
        priorities,
        since,
        until,
        sort,
        limit,
        page,
      });

      Output.outputResult(result, ListOutput.formatListResults);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
