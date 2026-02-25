import { Command } from 'commander';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { listAll, parseSort } from '../services/list';
import type { ListEntityType, ListResponse, ListItem } from '../services/list';
import { handleCommandError, outputResult } from '../utils/output';
import {
  parsePaginationOptions,
  validateListEntityTypes,
  validatePriorities,
  parseCommaSeparated,
} from '../utils/validator';
import { STATUS_PAD_WIDTH, TYPE_PAD_WIDTH, RADIX_DECIMAL } from '../utils/constants';
import type { ListCommandOptions } from '../types/options';

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
      const { limit, page } = parsePaginationOptions(options);

      const rawTypes = parseCommaSeparated(options.type);
      let types: ListEntityType[] | undefined;

      if (rawTypes) {
        validateListEntityTypes(rawTypes);
        types = rawTypes;
      }

      const statuses = parseCommaSeparated(options.status);

      let priorities: number[] | undefined;
      if (options.priority) {
        priorities = options.priority
          .split(',')
          .map((p) => Number.parseInt(p.trim(), RADIX_DECIMAL));
      }

      if (priorities) {
        validatePriorities(priorities);
      }

      let sort;
      try {
        sort = parseSort(options.sort);
      } catch (err) {
        if (err instanceof Error) {
          throw new Error(`Invalid sort: ${err.message}`);
        }
        throw new Error(`Invalid sort: ${String(err)}`);
      }

      const since = parseDate(options.since);
      if (options.since && !since) {
        throw new Error('Invalid since date. Use YYYY-MM-DD format.');
      }

      const until = parseUntilDate(options.until);
      if (options.until && !until) {
        throw new Error('Invalid until date. Use YYYY-MM-DD format.');
      }

      const result = listAll({
        types,
        statuses,
        priorities,
        since,
        until,
        sort,
        limit,
        page,
      });

      outputResult(result, formatListResults);
    } catch (err) {
      handleCommandError(err);
    }
  });

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) {
    return undefined;
  }
  const parsed = dayjs(dateStr, 'YYYY-MM-DD', true);
  if (parsed.isValid()) {
    return parsed.toDate();
  }
  return undefined;
}

function parseUntilDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) {
    return undefined;
  }
  const parsed = dayjs(dateStr, 'YYYY-MM-DD', true);
  if (parsed.isValid()) {
    return parsed.endOf('day').toDate();
  }
  return undefined;
}

function formatListResults(result: ListResponse): string {
  const lines: string[] = [];

  lines.push(`Found ${result.total} items (page ${result.page}, ${result.limit} per page)`);
  lines.push('');

  if (result.items.length === 0) {
    lines.push('No items found.');
    return lines.join('\n');
  }

  for (const item of result.items) {
    lines.push(formatItem(item));
  }

  const totalPages = Math.ceil(result.total / result.limit);
  if (totalPages > 1) {
    lines.push('');
    lines.push(`Page ${result.page} of ${totalPages}`);
  }

  return lines.join('\n');
}

function formatItem(item: ListItem): string {
  const typeLabel = item.type.toUpperCase().padEnd(TYPE_PAD_WIDTH);
  const statusLabel = item.status.padEnd(STATUS_PAD_WIDTH);
  const priorityLabel = `P${item.priority}`;
  let parentLabel = '';
  if (item.parentId) {
    parentLabel = ` (${item.parentId})`;
  }

  return `${typeLabel} ${item.id} | ${statusLabel} | ${priorityLabel} | ${item.title}${parentLabel}`;
}
