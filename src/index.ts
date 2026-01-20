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
import { setToonMode } from "./utils/output";
import pkg from "../package.json";

const program = new Command();

program
  .name("trekker")
  .description("CLI-based issue tracker for coding agents")
  .version(pkg.version)
  .option("--toon", "Output in TOON format")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.toon) {
      setToonMode(true);
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

// Parse and execute
program.parse();
