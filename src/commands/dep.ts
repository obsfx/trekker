import { Command } from "commander";
import {
  addDependency,
  removeDependency,
  getDependencies,
} from "../services/dependency";
import {
  success,
  error,
  output,
  formatDependencyList,
  isToonMode,
} from "../utils/output";

export const depCommand = new Command("dep").description(
  "Manage task dependencies"
);

depCommand
  .command("add <task-id> <depends-on-id>")
  .description("Add a dependency (task-id depends on depends-on-id)")
  .action((taskId, dependsOnId) => {
    try {
      const dependency = addDependency(taskId, dependsOnId);

      if (isToonMode()) {
        output(dependency);
      } else {
        success(`Dependency added: ${taskId} → depends on ${dependsOnId}`);
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

depCommand
  .command("remove <task-id> <depends-on-id>")
  .description("Remove a dependency")
  .action((taskId, dependsOnId) => {
    try {
      removeDependency(taskId, dependsOnId);
      success(`Dependency removed: ${taskId} → ${dependsOnId}`);
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

depCommand
  .command("list <task-id>")
  .description("List dependencies for a task")
  .action((taskId) => {
    try {
      const { dependsOn, blocks } = getDependencies(taskId);

      if (isToonMode()) {
        output({ taskId, dependsOn, blocks });
      } else {
        console.log(`Dependencies for ${taskId}:`);
        console.log("\nDepends on:");
        console.log(formatDependencyList(dependsOn, "depends_on"));
        console.log("\nBlocks:");
        console.log(formatDependencyList(blocks, "blocks"));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
