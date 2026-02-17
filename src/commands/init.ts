import { Command } from "commander";
import { initProject, isDbInitialized } from "../services/project";
import { getCurrentDbName } from "../utils/db-context";
import { success, error } from "../utils/output";

export const initCommand = new Command("init")
  .description("Initialize Trekker in the current directory")
  .action(() => {
    try {
      const dbName = getCurrentDbName();

      if (isDbInitialized(dbName)) {
        error(`Database '${dbName}' is already initialized in this directory.`);
        process.exit(1);
      }

      initProject();
      success(`Trekker initialized successfully (database: ${dbName}).`);
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
