#!/usr/bin/env bun
import { Command } from 'commander';
import { initCommand } from '@/src/commands/init';
import { wipeCommand } from '@/src/commands/wipe';
import { epicCommand } from '@/src/commands/epic';
import { taskCommand } from '@/src/commands/task';
import { subtaskCommand } from '@/src/commands/subtask';
import { commentCommand } from '@/src/commands/comment';
import { depCommand } from '@/src/commands/dep';
import { quickstartCommand } from '@/src/commands/quickstart';
import { seedCommand } from '@/src/commands/seed';
import { searchCommand } from '@/src/commands/search';
import { historyCommand } from '@/src/commands/history';
import { listCommand } from '@/src/commands/list';
import { readyCommand } from '@/src/commands/ready';
import { configCommand } from '@/src/commands/config';
import { serveCommand } from '@/src/commands/serve';
import { Output } from '@/src/utils/output';
import pkg from '@/package.json';
import type { ProgramOptions } from '@/src/types/options';

const program = new Command();

program
  .name('trekker')
  .description('CLI-based issue tracker for coding agents')
  .version(pkg.version)
  .option('--toon', 'Output in TOON format')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts<ProgramOptions>();
    if (opts.toon) {
      Output.setToonMode(true);
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
program.addCommand(readyCommand);
program.addCommand(configCommand);
program.addCommand(serveCommand);

// Parse and execute
await program.parseAsync();
