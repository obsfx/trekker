import { Command } from "commander";
import { semanticSearch } from "../services/semantic-search";
import type { SearchEntityType, SemanticSearchResponse } from "../services/semantic-search";
import { handleCommandError, outputResult } from "../utils/output";
import { validatePagination, validateSearchEntityTypes } from "../utils/validator";

export const semanticSearchCommand = new Command("semantic-search")
  .description("Search across epics, tasks, subtasks, and comments using semantic similarity")
  .argument("<query>", "Natural language search query")
  .option("--type <types>", "Filter by type: epic,task,subtask,comment (comma-separated)")
  .option("--status <status>", "Filter by status")
  .option("--threshold <n>", "Minimum similarity threshold 0-1 (default: 0.5)", "0.5")
  .option("--limit <n>", "Results per page (default: 20)", "20")
  .option("--page <n>", "Page number (default: 1)", "1")
  .action(async (query, options) => {
    try {
      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      const threshold = parseFloat(options.threshold);

      validatePagination(limit, page);

      if (isNaN(threshold) || threshold < 0 || threshold > 1) {
        throw new Error("Invalid threshold value. Must be between 0 and 1.");
      }

      const types = options.type
        ? options.type.split(",").map((t: string) => t.trim())
        : undefined;

      if (types) validateSearchEntityTypes(types);

      const result = await semanticSearch(query, {
        types: types as SearchEntityType[] | undefined,
        status: options.status,
        threshold,
        limit,
        page,
      });

      outputResult(result, formatSemanticSearchResults);
    } catch (err) {
      handleCommandError(err);
    }
  });

function formatSemanticSearchResults(result: SemanticSearchResponse): string {
  const lines: string[] = [];

  lines.push(`Semantic Search: "${result.query}"`);
  lines.push(`Found ${result.total} results (page ${result.page}, ${result.limit} per page)`);
  lines.push("");

  if (result.results.length === 0) {
    lines.push("No results found.");
    return lines.join("\n");
  }

  for (const r of result.results) {
    const typeLabel = r.type.toUpperCase().padEnd(7);
    const similarityLabel = `[${r.similarity.toFixed(2)}]`;
    const statusLabel = r.status ? ` [${r.status}]` : "";
    const parentLabel = r.parentId ? ` (parent: ${r.parentId})` : "";

    lines.push(`${typeLabel} ${r.id} ${similarityLabel}${statusLabel}${parentLabel}`);
    if (r.title) {
      lines.push(`  ${r.title}`);
    }
    lines.push("");
  }

  const totalPages = Math.ceil(result.total / result.limit);
  if (totalPages > 1) {
    lines.push(`Page ${result.page} of ${totalPages}`);
  }

  return lines.join("\n");
}
