import { Command } from 'commander';
import { DbClient } from '@/src/db/client';
import { ProjectService } from '@/src/services/project';
import { Output } from '@/src/utils/output';
import type { InitCommandOptions } from '@/src/types/options';

export const initCommand = new Command('init')
  .description('Initialize Trekker in the current directory')
  .option('--issue-prefix <value>', 'Prefix for tasks and subtasks (default: TREK)')
  .option('--epic-prefix <value>', 'Prefix for epics (default: EPIC)')
  .option('--comment-prefix <value>', 'Prefix for comments (default: CMT)')
  .action((options: InitCommandOptions) => {
    try {
      if (DbClient.isTrekkerInitialized()) {
        Output.error('Trekker is already initialized in this directory.');
        process.exit(1);
      }

      ProjectService.initProject(process.cwd(), {
        issue_prefix: options.issuePrefix,
        epic_prefix: options.epicPrefix,
        comment_prefix: options.commentPrefix,
      });
      Output.success('Trekker initialized successfully.');
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
