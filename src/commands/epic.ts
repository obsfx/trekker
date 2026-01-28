import { Command } from "commander";
import {
  createEpic,
  getEpic,
  listEpics,
  updateEpic,
  deleteEpic,
  completeEpic,
} from "../services/epic";
import { parseStatus, parsePriority, validateRequired } from "../utils/validator";
import {
  success,
  formatEpic,
  formatEpicList,
  handleCommandError,
  handleNotFound,
  outputResult,
  isToonMode,
  output,
} from "../utils/output";
import type { EpicStatus } from "../types";

export const epicCommand = new Command("epic").description("Manage epics");

epicCommand
  .command("create")
  .description("Create a new epic")
  .requiredOption("-t, --title <title>", "Epic title")
  .option("-d, --description <description>", "Epic description")
  .option("-p, --priority <priority>", "Priority (0-5, default: 2)")
  .option("-s, --status <status>", "Status (todo, in_progress, completed, archived)")
  .action(async (options) => {
    try {
      validateRequired(options.title, "Title");

      const epic = await createEpic({
        title: options.title,
        description: options.description,
        priority: parsePriority(options.priority),
        status: parseStatus(options.status, "epic") as EpicStatus | undefined,
      });

      outputResult(epic, formatEpic, `Epic created: ${epic.id}`);
    } catch (err) {
      handleCommandError(err);
    }
  });

epicCommand
  .command("list")
  .description("List all epics")
  .option("-s, --status <status>", "Filter by status")
  .action(async (options) => {
    try {
      const status = parseStatus(options.status, "epic") as EpicStatus | undefined;
      const epics = await listEpics(status);

      outputResult(epics, formatEpicList);
    } catch (err) {
      handleCommandError(err);
    }
  });

epicCommand
  .command("show <epic-id>")
  .description("Show epic details")
  .action(async (epicId) => {
    try {
      const epic = await getEpic(epicId);
      if (!epic) return handleNotFound("Epic", epicId);

      outputResult(epic, formatEpic);
    } catch (err) {
      handleCommandError(err);
    }
  });

epicCommand
  .command("update <epic-id>")
  .description("Update an epic")
  .option("-t, --title <title>", "New title")
  .option("-d, --description <description>", "New description")
  .option("-p, --priority <priority>", "New priority (0-5)")
  .option("-s, --status <status>", "New status")
  .action(async (epicId, options) => {
    try {
      const epic = await updateEpic(epicId, {
        title: options.title,
        description: options.description,
        priority: parsePriority(options.priority),
        status: parseStatus(options.status, "epic") as EpicStatus | undefined,
      });

      outputResult(epic, formatEpic, `Epic updated: ${epic.id}`);
    } catch (err) {
      handleCommandError(err);
    }
  });

epicCommand
  .command("delete <epic-id>")
  .description("Delete an epic")
  .action(async (epicId) => {
    try {
      await deleteEpic(epicId);
      success(`Epic deleted: ${epicId}`);
    } catch (err) {
      handleCommandError(err);
    }
  });

epicCommand
  .command("complete <epic-id>")
  .description("Complete an epic and archive all its tasks and subtasks")
  .action(async (epicId) => {
    try {
      const result = await completeEpic(epicId);

      if (isToonMode()) {
        output(result);
      } else {
        success(`Epic completed: ${result.epic}`);
        console.log(`Archived ${result.archived.tasks} task(s) and ${result.archived.subtasks} subtask(s)`);
      }
    } catch (err) {
      handleCommandError(err);
    }
  });
