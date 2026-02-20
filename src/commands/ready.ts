import { Command } from "commander";
import { getReadyTasks, type ReadyTask } from "../services/ready";
import { handleCommandError, outputResult } from "../utils/output";

export const readyCommand = new Command("ready")
  .description("Show tasks that are ready to work on (unblocked, todo)")
  .action(() => {
    try {
      const readyTasks = getReadyTasks();
      outputResult(readyTasks, formatReadyTasks);
    } catch (err) {
      handleCommandError(err);
    }
  });

function formatReadyTasks(tasks: ReadyTask[]): string {
  if (tasks.length === 0) {
    return "No ready tasks found.";
  }

  const lines: string[] = [];
  lines.push(`${tasks.length} ready task(s):\n`);

  for (const task of tasks) {
    const epic = task.epicId ? ` (${task.epicId})` : "";
    const tags = task.tags ? ` [${task.tags}]` : "";
    lines.push(`${task.id} | P${task.priority} | ${task.title}${epic}${tags}`);

    if (task.dependents.length > 0) {
      for (const dep of task.dependents) {
        lines.push(`  -> unblocks ${dep.id} | ${dep.status.padEnd(11)} | P${dep.priority} | ${dep.title}`);
      }
    }
  }

  return lines.join("\n");
}
