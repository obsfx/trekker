import { Command } from 'commander';
import { initProject, isTrekkerInitialized } from '../services/project';
import { success, handleCommandError, error } from '../utils/output';
import type { InitCommandOptions } from '../types/options';

export const initCommand = new Command('init')
  .description('Initialize Trekker in the current directory')
  .option('--issue-prefix <value>', 'Prefix for tasks and subtasks (default: TREK)')
  .option('--epic-prefix <value>', 'Prefix for epics (default: EPIC)')
  .option('--comment-prefix <value>', 'Prefix for comments (default: CMT)')
  .action((options: InitCommandOptions) => {
    try {
      if (isTrekkerInitialized()) {
        error('Trekker is already initialized in this directory.');
        process.exit(1);
      }

      initProject(process.cwd(), {
        issue_prefix: options.issuePrefix,
        epic_prefix: options.epicPrefix,
        comment_prefix: options.commentPrefix,
      });
      success('Trekker initialized successfully.');
    } catch (err) {
      handleCommandError(err);
    }
  });
