import { Command } from "commander";
import { wipeProject, isTrekkerInitialized } from "../services/project";
import { success, error } from "../utils/output";
import * as readline from "readline";

export const wipeCommand = new Command("wipe")
  .description("Delete all Trekker data in the current directory")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (options) => {
    try {
      if (!isTrekkerInitialized()) {
        error("Trekker is not initialized in this directory.");
        process.exit(1);
      }

      if (!options.yes) {
        const confirmed = await confirm(
          "Are you sure you want to delete all Trekker data? This cannot be undone. (y/N): "
        );
        if (!confirmed) {
          console.log("Aborted.");
          return;
        }
      }

      wipeProject();
      success("Trekker data deleted successfully.");
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

function confirm(prompt: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}
