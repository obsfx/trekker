import { Command } from "commander";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { listAll, parseSort, VALID_SORT_FIELDS } from "../services/list";

dayjs.extend(customParseFormat);
import type { ListEntityType, ListResponse, ListItem } from "../services/list";
import { error, output, isToonMode } from "../utils/output";

export const listCommand = new Command("list")
  .description("List all epics, tasks, and subtasks")
  .option("--type <types>", "Filter by type: epic,task,subtask (comma-separated)")
  .option("--status <statuses>", "Filter by status (comma-separated)")
  .option("--priority <levels>", "Filter by priority: 0-5 (comma-separated)")
  .option("--since <date>", "Created after date (YYYY-MM-DD)")
  .option("--until <date>", "Created before date (YYYY-MM-DD)")
  .option("--sort <fields>", "Sort by fields (field:direction, comma-separated)", "created:desc")
  .option("--limit <n>", "Results per page (default: 50)", "50")
  .option("--page <n>", "Page number (default: 1)", "1")
  .action((options) => {
    try {
      const types = options.type
        ? (options.type.split(",").map((t: string) => t.trim()) as ListEntityType[])
        : undefined;

      const statuses = options.status
        ? options.status.split(",").map((s: string) => s.trim())
        : undefined;

      const priorities = options.priority
        ? options.priority.split(",").map((p: string) => parseInt(p.trim(), 10))
        : undefined;

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);

      if (isNaN(limit) || limit < 1) {
        throw new Error("Invalid limit value");
      }
      if (isNaN(page) || page < 1) {
        throw new Error("Invalid page value");
      }

      // Validate types
      const validTypes = ["epic", "task", "subtask"];
      if (types) {
        for (const t of types) {
          if (!validTypes.includes(t)) {
            throw new Error(`Invalid type: ${t}. Valid types: ${validTypes.join(", ")}`);
          }
        }
      }

      // Validate priorities
      if (priorities) {
        for (const p of priorities) {
          if (isNaN(p) || p < 0 || p > 5) {
            throw new Error(`Invalid priority: ${p}. Valid priorities: 0-5`);
          }
        }
      }

      // Parse sort
      let sort;
      try {
        sort = parseSort(options.sort);
      } catch (err) {
        throw new Error(`Invalid sort: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Parse dates
      let since: Date | undefined;
      let until: Date | undefined;

      if (options.since) {
        since = parseDate(options.since);
        if (!since) {
          throw new Error("Invalid since date. Use YYYY-MM-DD format.");
        }
      }

      if (options.until) {
        const parsedUntil = dayjs(options.until, "YYYY-MM-DD", true);
        if (!parsedUntil.isValid()) {
          throw new Error("Invalid until date. Use YYYY-MM-DD format.");
        }
        // Set to end of day
        until = parsedUntil.endOf("day").toDate();
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

      if (isToonMode()) {
        output(result);
      } else {
        console.log(formatListResults(result));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

function parseDate(dateStr: string): Date | undefined {
  const parsed = dayjs(dateStr, "YYYY-MM-DD", true);
  if (!parsed.isValid()) {
    return undefined;
  }
  return parsed.toDate();
}

function formatListResults(result: ListResponse): string {
  const lines: string[] = [];

  lines.push(`Found ${result.total} items (page ${result.page}, ${result.limit} per page)`);
  lines.push("");

  if (result.items.length === 0) {
    lines.push("No items found.");
    return lines.join("\n");
  }

  // Table format
  for (const item of result.items) {
    lines.push(formatItem(item));
  }

  // Pagination info
  const totalPages = Math.ceil(result.total / result.limit);
  if (totalPages > 1) {
    lines.push("");
    lines.push(`Page ${result.page} of ${totalPages}`);
  }

  return lines.join("\n");
}

function formatItem(item: ListItem): string {
  const typeLabel = item.type.toUpperCase().padEnd(7);
  const statusLabel = item.status.padEnd(11);
  const priorityLabel = `P${item.priority}`;
  const parentLabel = item.parentId ? ` (${item.parentId})` : "";

  return `${typeLabel} ${item.id} | ${statusLabel} | ${priorityLabel} | ${item.title}${parentLabel}`;
}
