import { Command } from "commander";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { getHistory } from "../services/history";

dayjs.extend(customParseFormat);
import type { HistoryEntityType, HistoryAction, HistoryResponse, HistoryEvent } from "../services/history";
import { error, output, isToonMode } from "../utils/output";

export const historyCommand = new Command("history")
  .description("View history of all changes (creates, updates, deletes)")
  .option("--entity <id>", "Filter by entity ID (e.g., TREK-1, EPIC-1)")
  .option("--type <types>", "Filter by type: epic,task,subtask,comment,dependency (comma-separated)")
  .option("--action <actions>", "Filter by action: create,update,delete (comma-separated)")
  .option("--since <date>", "Events after date (YYYY-MM-DD)")
  .option("--until <date>", "Events before date (YYYY-MM-DD)")
  .option("--limit <n>", "Results per page (default: 50)", "50")
  .option("--page <n>", "Page number (default: 1)", "1")
  .action((options) => {
    try {
      const types = options.type
        ? (options.type.split(",").map((t: string) => t.trim()) as HistoryEntityType[])
        : undefined;

      const actions = options.action
        ? (options.action.split(",").map((a: string) => a.trim()) as HistoryAction[])
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
      const validTypes = ["epic", "task", "subtask", "comment", "dependency"];
      if (types) {
        for (const t of types) {
          if (!validTypes.includes(t)) {
            throw new Error(`Invalid type: ${t}. Valid types: ${validTypes.join(", ")}`);
          }
        }
      }

      // Validate actions
      const validActions = ["create", "update", "delete"];
      if (actions) {
        for (const a of actions) {
          if (!validActions.includes(a)) {
            throw new Error(`Invalid action: ${a}. Valid actions: ${validActions.join(", ")}`);
          }
        }
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

function formatHistoryResults(result: HistoryResponse): string {
  const lines: string[] = [];

  lines.push(`History: ${result.total} events (page ${result.page}, ${result.limit} per page)`);
  lines.push("");

  if (result.events.length === 0) {
    lines.push("No events found.");
    return lines.join("\n");
  }

  for (const event of result.events) {
    lines.push(formatEvent(event));
    lines.push("");
  }

  // Pagination info
  const totalPages = Math.ceil(result.total / result.limit);
  if (totalPages > 1) {
    lines.push(`Page ${result.page} of ${totalPages}`);
  }

  return lines.join("\n");
}

function formatEvent(event: HistoryEvent): string {
  const lines: string[] = [];
  const timestamp = event.timestamp.toISOString().replace("T", " ").substring(0, 19);
  const actionLabel = event.action.toUpperCase().padEnd(6);
  const typeLabel = event.entityType.toUpperCase();

  lines.push(`[${timestamp}] ${actionLabel} ${typeLabel} ${event.entityId}`);

  if (event.action === "update" && event.changes) {
    for (const [field, change] of Object.entries(event.changes)) {
      const from = formatValue(change.from);
      const to = formatValue(change.to);
      lines.push(`  ${field}: ${from} -> ${to}`);
    }
  } else if (event.snapshot) {
    // For create/delete, show key fields
    const snap = event.snapshot;
    if (snap.title) {
      lines.push(`  title: ${snap.title}`);
    }
    if (snap.content) {
      lines.push(`  content: ${truncate(String(snap.content), 60)}`);
    }
    if (snap.status) {
      lines.push(`  status: ${snap.status}`);
    }
  }

  return lines.join("\n");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "(none)";
  }
  if (typeof value === "string") {
    return truncate(value, 40);
  }
  return String(value);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) {
    return str;
  }
  return str.substring(0, maxLen - 3) + "...";
}
