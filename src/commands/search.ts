import plur from 'plur';
import { Command } from 'commander';
import { DbClient } from '@/src/db/client';
import { SearchService } from '@/src/services/search';
import type { SearchResponse } from '@/src/services/search';
import { Output } from '@/src/utils/output';
import { Validator } from '@/src/utils/validator';
import { TYPE_PAD_WIDTH } from '@/src/utils/constants';
import type { SearchCommandOptions } from '@/src/types/options';
import type { SearchEntityType } from '@/src/types';

abstract class SearchOutput {
  static readonly formatSearchResults = (result: SearchResponse): string => {
    const lines: string[] = [];

    lines.push(`Search: "${result.query}"`);
    lines.push(
      `Found ${result.total} ${plur('result', result.total)} (page ${result.page}, ${result.limit} per page)`
    );
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
      if (r.snippet) {
        lines.push(`  ${r.snippet}`);
      }
      lines.push('');
    }

    return Output.joinWithPageLine(lines, result.total, result.page, result.limit);
  };
}

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
        DbClient.rebuildSearchIndex();
      }

      const { limit, page } = Validator.parsePaginationOptions(options);

      const rawTypes = Validator.parseCommaSeparated(options.type);
      let types: SearchEntityType[] | undefined;

      if (rawTypes) {
        Validator.validateSearchEntityTypes(rawTypes);
        types = rawTypes;
      }

      const result = SearchService.search(query, {
        types,
        statuses: Validator.parseCommaSeparated(options.status),
        limit,
        page,
      });

      Output.outputResult(result, SearchOutput.formatSearchResults);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
