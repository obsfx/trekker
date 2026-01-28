import { Command } from "commander";
import {
  search,
  rebuildSearchIndex,
  hybridSearch,
  SEARCH_MODES,
  type SearchMode,
} from "../services/search";
import type {
  SearchEntityType,
  SearchResponse,
  HybridSearchResponse,
} from "../services/search";
import { semanticSearch } from "../services/semantic-search";
import { formatSemanticSearchResults } from "./semantic-search";
import { handleCommandError, outputResult } from "../utils/output";
import { validatePagination, validateSearchEntityTypes } from "../utils/validator";

export const searchCommand = new Command("search")
  .description("Search across epics, tasks, subtasks, and comments")
  .argument("<query>", "Search query (supports FTS5 syntax for keyword mode)")
  .option("--type <types>", "Filter by type: epic,task,subtask,comment (comma-separated)")
  .option("--status <status>", "Filter by status")
  .option("--limit <n>", "Results per page (default: 20)", "20")
  .option("--page <n>", "Page number (default: 1)", "1")
  .option("--mode <mode>", "Search mode: keyword, semantic, or hybrid (default: keyword)", "keyword")
  .option("--rebuild-index", "Rebuild the search index before searching")
  .action(async (query, options) => {
    try {
      if (options.rebuildIndex) {
        await rebuildSearchIndex();
      }

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      validatePagination(limit, page);

      const mode = options.mode as SearchMode;
      if (!SEARCH_MODES.includes(mode)) {
        throw new Error(
          `Invalid search mode: ${mode}. Valid modes: ${SEARCH_MODES.join(", ")}`
        );
      }

      const types = options.type
        ? options.type.split(",").map((t: string) => t.trim())
        : undefined;

      if (types) validateSearchEntityTypes(types);

      const searchOptions = {
        types: types as SearchEntityType[] | undefined,
        status: options.status,
        limit,
        page,
      };

      if (mode === "keyword") {
        const result = await search(query, searchOptions);
        outputResult(result, formatSearchResults);
        return;
      }

      if (mode === "semantic") {
        const result = await semanticSearch(query, { ...searchOptions, threshold: 0.5 });
        outputResult(result, formatSemanticSearchResults);
        return;
      }

      // hybrid mode
      const result = await hybridSearch(query, searchOptions);
      outputResult(result, formatHybridSearchResults);
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

function formatHybridSearchResults(result: HybridSearchResponse): string {
  const lines: string[] = [];

  lines.push(`Hybrid Search: "${result.query}"`);
  lines.push(`Found ${result.total} results (page ${result.page}, ${result.limit} per page)`);
  lines.push("");

  if (result.results.length === 0) {
    lines.push("No results found.");
    return lines.join("\n");
  }

  for (const r of result.results) {
    const typeLabel = r.type.toUpperCase().padEnd(7);
    const scoreLabel = `[${r.score.toFixed(2)}]`;
    const statusLabel = r.status ? ` [${r.status}]` : "";
    const parentLabel = r.parentId ? ` (parent: ${r.parentId})` : "";

    lines.push(`${typeLabel} ${r.id} ${scoreLabel}${statusLabel}${parentLabel}`);
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
