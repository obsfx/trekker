import { Command } from "commander";
import { wipeProject, isTrekkerInitialized, isDbInitialized } from "../services/project";
import { getCurrentDbName, isDbExplicitlySet } from "../utils/db-context";
import { success, error } from "../utils/output";
import * as readline from "readline";

export const wipeCommand = new Command("wipe")
  .description("Delete all Trekker data in the current directory")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (options) => {
    try {
      const dbName = getCurrentDbName();
      const scopedWipe = isDbExplicitlySet();

      if (scopedWipe) {
        if (!isDbInitialized(dbName)) {
          error(`Database '${dbName}' is not initialized in this directory.`);
          process.exit(1);
        }
      } else {
        if (!isTrekkerInitialized()) {
          error("Trekker is not initialized in this directory.");
          process.exit(1);
        }
      }

      if (!options.yes) {
        const msg = scopedWipe
          ? `Are you sure you want to delete database '${dbName}'? This cannot be undone. (y/N): `
          : "Are you sure you want to delete all Trekker data? This cannot be undone. (y/N): ";
        const confirmed = await confirm(msg);
        if (!confirmed) {
          console.log("Aborted.");
          return;
        }
      }

      if (scopedWipe) {
        wipeProject(process.cwd(), dbName);
        success(`Database '${dbName}' deleted successfully.`);
      } else {
        wipeProject();
        success("Trekker data deleted successfully.");
      }
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
