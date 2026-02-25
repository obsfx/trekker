import { Command } from 'commander';
import { search, rebuildSearchIndex } from '../services/search';
import type { SearchResponse } from '../services/search';
import { handleCommandError, outputResult } from '../utils/output';
import {
  parsePaginationOptions,
  validateSearchEntityTypes,
  parseCommaSeparated,
} from '../utils/validator';
import { TYPE_PAD_WIDTH } from '../utils/constants';
import type { SearchCommandOptions } from '../types/options';
import type { SearchEntityType } from '../types';

export const searchCommand = new Command('search')
  .description('Search across epics, tasks, subtasks, and comments')
  .argument('<query>', 'Search query (supports FTS5 syntax)')
  .option('--type <types>', 'Filter by type: epic,task,subtask,comment (comma-separated)')
  .option('--status <status>', 'Filter by status')
  .option('--limit <n>', 'Results per page (default: 20)', '20')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .option('--rebuild-index', 'Rebuild the search index before searching')
  .action((query: string, options: SearchCommandOptions) => {
    try {
      if (options.rebuildIndex) {
        rebuildSearchIndex();
      }

      const { limit, page } = parsePaginationOptions(options);

      const rawTypes = parseCommaSeparated(options.type);
      let types: SearchEntityType[] | undefined;

      if (rawTypes) {
        validateSearchEntityTypes(rawTypes);
        types = rawTypes;
      }

      const result = search(query, {
        types,
        status: options.status,
        limit,
        page,
      });

      outputResult(result, formatSearchResults);
    } catch (err) {
      handleCommandError(err);
    }
  });

function formatSearchResults(result: SearchResponse): string {
  const lines: string[] = [];

  lines.push(`Search: "${result.query}"`);
  lines.push(`Found ${result.total} results (page ${result.page}, ${result.limit} per page)`);
  lines.push('');

  if (result.results.length === 0) {
    lines.push('No results found.');
    return lines.join('\n');
  }

  for (const r of result.results) {
    const typeLabel = r.type.toUpperCase().padEnd(TYPE_PAD_WIDTH);
    let statusLabel = '';
    if (r.status) {
      statusLabel = ` [${r.status}]`;
    }
    let parentLabel = '';
    if (r.parentId) {
      parentLabel = ` (parent: ${r.parentId})`;
    }

    lines.push(`${typeLabel} ${r.id}${statusLabel}${parentLabel}`);
    if (r.title) {
      lines.push(`  Title: ${r.title}`);
    }
    lines.push(`  ${r.snippet}`);
    lines.push('');
  }

  const totalPages = Math.ceil(result.total / result.limit);
  if (totalPages > 1) {
    lines.push(`Page ${result.page} of ${totalPages}`);
  }

  return lines.join('\n');
}
