import { Command } from "commander";
import { search, rebuildSearchIndex } from "../services/search";
import type { SearchEntityType, SearchResponse } from "../services/search";
import { handleCommandError, outputResult } from "../utils/output";
import { validatePagination, validateSearchEntityTypes } from "../utils/validator";

export const searchCommand = new Command("search")
  .description("Search across epics, tasks, subtasks, and comments")
  .argument("<query>", "Search query (supports FTS5 syntax)")
  .option("--type <types>", "Filter by type: epic,task,subtask,comment (comma-separated)")
  .option("--status <status>", "Filter by status")
  .option("--limit <n>", "Results per page (default: 20)", "20")
  .option("--page <n>", "Page number (default: 1)", "1")
  .option("--rebuild-index", "Rebuild the search index before searching")
  .action((query, options) => {
    try {
      if (options.rebuildIndex) {
        rebuildSearchIndex();
      }

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      validatePagination(limit, page);

      const types = options.type
        ? options.type.split(",").map((t: string) => t.trim())
        : undefined;

      if (types) validateSearchEntityTypes(types);

      const result = search(query, {
        types: types as SearchEntityType[] | undefined,
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
  lines.push("");

  if (result.results.length === 0) {
    lines.push("No results found.");
    return lines.join("\n");
  }

  for (const r of result.results) {
    const typeLabel = r.type.toUpperCase().padEnd(7);
    const statusLabel = r.status ? ` [${r.status}]` : "";
    const parentLabel = r.parentId ? ` (parent: ${r.parentId})` : "";

    lines.push(`${typeLabel} ${r.id}${statusLabel}${parentLabel}`);
    if (r.title) {
      lines.push(`  Title: ${r.title}`);
    }
    lines.push(`  ${r.snippet}`);
    lines.push("");
  }

  const totalPages = Math.ceil(result.total / result.limit);
  if (totalPages > 1) {
    lines.push(`Page ${result.page} of ${totalPages}`);
  }

  return lines.join("\n");
}
