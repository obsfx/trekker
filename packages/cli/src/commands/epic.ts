import { Command } from "commander";
import {
  createEpic,
  getEpic,
  listEpics,
  updateEpic,
  deleteEpic,
} from "../services/epic";
import { parseStatus, parsePriority, validateRequired } from "../utils/validator";
import {
  success,
  error,
  output,
  formatEpic,
  formatEpicList,
  isJsonMode,
} from "../utils/output";
import type { EpicStatus } from "../types";

export const epicCommand = new Command("epic").description(
  "Manage epics"
);

epicCommand
  .command("create")
  .description("Create a new epic")
  .requiredOption("-t, --title <title>", "Epic title")
  .option("-d, --description <description>", "Epic description")
  .option("-p, --priority <priority>", "Priority (0-5, default: 2)")
  .option("-s, --status <status>", "Status (todo, in_progress, completed, archived)")
  .action((options) => {
    try {
      validateRequired(options.title, "Title");

      const epic = createEpic({
        title: options.title,
        description: options.description,
        priority: parsePriority(options.priority),
        status: parseStatus(options.status, "epic") as EpicStatus | undefined,
      });

      if (isJsonMode()) {
        output(epic);
      } else {
        success(`Epic created: ${epic.id}`);
        console.log(formatEpic(epic));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

epicCommand
  .command("list")
  .description("List all epics")
  .option("-s, --status <status>", "Filter by status")
  .action((options) => {
    try {
      const status = parseStatus(options.status, "epic") as EpicStatus | undefined;
      const epics = listEpics(status);

      if (isJsonMode()) {
        output(epics);
      } else {
        console.log(formatEpicList(epics));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

epicCommand
  .command("show <epic-id>")
  .description("Show epic details")
  .action((epicId) => {
    try {
      const epic = getEpic(epicId);

      if (!epic) {
        error(`Epic not found: ${epicId}`);
        process.exit(1);
      }

      if (isJsonMode()) {
        output(epic);
      } else {
        console.log(formatEpic(epic));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

epicCommand
  .command("update <epic-id>")
  .description("Update an epic")
  .option("-t, --title <title>", "New title")
  .option("-d, --description <description>", "New description")
  .option("-p, --priority <priority>", "New priority (0-5)")
  .option("-s, --status <status>", "New status")
  .action((epicId, options) => {
    try {
      const epic = updateEpic(epicId, {
        title: options.title,
        description: options.description,
        priority: parsePriority(options.priority),
        status: parseStatus(options.status, "epic") as EpicStatus | undefined,
      });

      if (isJsonMode()) {
        output(epic);
      } else {
        success(`Epic updated: ${epic.id}`);
        console.log(formatEpic(epic));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

epicCommand
  .command("delete <epic-id>")
  .description("Delete an epic")
  .action((epicId) => {
    try {
      deleteEpic(epicId);
      success(`Epic deleted: ${epicId}`);
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
