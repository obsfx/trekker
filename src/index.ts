#!/usr/bin/env bun
import { Command } from "commander";
import { initCommand } from "./commands/init";
import { wipeCommand } from "./commands/wipe";
import { epicCommand } from "./commands/epic";
import { taskCommand } from "./commands/task";
import { subtaskCommand } from "./commands/subtask";
import { commentCommand } from "./commands/comment";
import { depCommand } from "./commands/dep";
import { quickstartCommand } from "./commands/quickstart";
import { seedCommand } from "./commands/seed";
import { searchCommand } from "./commands/search";
import { historyCommand } from "./commands/history";
import { listCommand } from "./commands/list";
import { setToonMode } from "./utils/output";
import { setCurrentDbName } from "./utils/db-context";
import pkg from "../package.json";

// Pre-process argv to extract db:xxx tokens before Commander sees them
const argv = process.argv.slice();
let dbFromArgv: string | undefined;

for (let i = 2; i < argv.length; i++) {
  const arg = argv[i];
  if (arg.startsWith("db:")) {
    dbFromArgv = arg.slice(3);
    argv.splice(i, 1);
    i--;
  }
}

const program = new Command();

program
  .name("trekker")
  .description("CLI-based issue tracker for coding agents")
  .version(pkg.version)
  .option("--toon", "Output in TOON format")
  .option("--db <name>", "Database name (default: trekker)")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.toon) {
      setToonMode(true);
    }
    const dbName = dbFromArgv ?? opts.db;
    if (dbName) {
      setCurrentDbName(dbName);
    }
  });

// Add commands
program.addCommand(initCommand);
program.addCommand(wipeCommand);
program.addCommand(epicCommand);
program.addCommand(taskCommand);
program.addCommand(subtaskCommand);
program.addCommand(commentCommand);
program.addCommand(depCommand);
program.addCommand(quickstartCommand);
program.addCommand(seedCommand);
program.addCommand(searchCommand);
program.addCommand(historyCommand);
program.addCommand(listCommand);

// Parse and execute
program.parse(argv);
