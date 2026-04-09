import { Command } from 'commander';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { getHistory } from '../services/history';

dayjs.extend(customParseFormat);
import type { HistoryResponse, HistoryEvent } from '../services/history';
import { handleCommandError, output, isToonMode } from '../utils/output';
import {
  parsePaginationOptions,
  parseCommaSeparated,
  validateHistoryTypes,
  validateHistoryActions,
} from '../utils/validator';
import {
  ACTION_PAD_WIDTH,
  TIMESTAMP_SLICE_END,
  TRUNCATE_DEFAULT,
  TRUNCATE_CONTENT,
  TRUNCATE_OFFSET,
} from '../utils/constants';
import type { HistoryCommandOptions } from '../types/options';

export const historyCommand = new Command('history')
  .description('View history of all changes (creates, updates, deletes)')
  .option('--entity <id>', 'Filter by entity ID')
  .option(
    '--type <types>',
    'Filter by type: epic,task,subtask,comment,dependency (comma-separated)'
  )
  .option('--action <actions>', 'Filter by action: create,update,delete (comma-separated)')
  .option('--since <date>', 'Events after date (YYYY-MM-DD)')
  .option('--until <date>', 'Events before date (YYYY-MM-DD)')
  .option('--limit <n>', 'Results per page (default: 50)', '50')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .action((options: HistoryCommandOptions) => {
    try {
      const types = parseCommaSeparated(options.type);
      const actions = parseCommaSeparated(options.action);
      const { limit, page } = parsePaginationOptions(options);

      // Validate types
      if (types) {
        validateHistoryTypes(types);
      }

      // Validate actions
      if (actions) {
        validateHistoryActions(actions);
      }

      // Parse dates
      let since: Date | undefined;
      let until: Date | undefined;

      if (options.since) {
        since = parseDate(options.since);
        if (!since) {
          throw new Error('Invalid since date. Use YYYY-MM-DD format.');
        }
      }

      if (options.until) {
        const parsedUntil = dayjs(options.until, 'YYYY-MM-DD', true);
        if (!parsedUntil.isValid()) {
          throw new Error('Invalid until date. Use YYYY-MM-DD format.');
        }
        // Set to end of day
        until = parsedUntil.endOf('day').toDate();
      }

      const result = getHistory({
        entityId: options.entity,
        types,
        actions,
        since,
        until,
        limit,
        page,
      });

      if (isToonMode()) {
        output(result);
      } else {
        console.log(formatHistoryResults(result));
      }
    } catch (err) {
      handleCommandError(err);
    }
  });

function parseDate(dateStr: string): Date | undefined {
  const parsed = dayjs(dateStr, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) {
    return undefined;
  }
  return parsed.toDate();
}

function formatHistoryResults(result: HistoryResponse): string {
  const lines: string[] = [];

  lines.push(`History: ${result.total} events (page ${result.page}, ${result.limit} per page)`);
  lines.push('');

  if (result.events.length === 0) {
    lines.push('No events found.');
    return lines.join('\n');
  }

  for (const event of result.events) {
    lines.push(formatEvent(event));
    lines.push('');
  }

  // Pagination info
  const totalPages = Math.ceil(result.total / result.limit);
  if (totalPages > 1) {
    lines.push(`Page ${result.page} of ${totalPages}`);
  }

  return lines.join('\n');
}

function formatEvent(event: HistoryEvent): string {
  const lines: string[] = [];
  const timestamp = event.timestamp.toISOString().replace('T', ' ').slice(0, TIMESTAMP_SLICE_END);
  const actionLabel = event.action.toUpperCase().padEnd(ACTION_PAD_WIDTH);
  const typeLabel = event.entityType.toUpperCase();

  lines.push(`[${timestamp}] ${actionLabel} ${typeLabel} ${event.entityId}`);

  if (event.action === 'update' && event.changes) {
    for (const [field, change] of Object.entries(event.changes)) {
      const from = formatValue(change.from);
      const to = formatValue(change.to);
      lines.push(`  ${field}: ${from} -> ${to}`);
    }
  } else if (event.snapshot) {
    // For create/delete, show key fields
    const snap = event.snapshot;
    if (typeof snap.title === 'string') {
      lines.push(`  title: ${snap.title}`);
    }
    if (typeof snap.content === 'string') {
      lines.push(`  content: ${truncate(snap.content, TRUNCATE_CONTENT)}`);
    }
    if (typeof snap.status === 'string') {
      lines.push(`  status: ${snap.status}`);
    }
  }

  return lines.join('\n');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(none)';
  }
  if (typeof value === 'string') {
    return truncate(value, TRUNCATE_DEFAULT);
  }
  if (typeof value === 'number') {
    return `${value}`;
  }
  if (typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) {
    return str;
  }
  return `${str.slice(0, Math.max(0, maxLen - TRUNCATE_OFFSET))}...`;
}
