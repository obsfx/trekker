import { Command } from 'commander';
import { initProject, isTrekkerInitialized } from '../services/project';
import { success, handleCommandError, error } from '../utils/output';

export const initCommand = new Command('init')
  .description('Initialize Trekker in the current directory')
  .action(() => {
    try {
      if (isTrekkerInitialized()) {
        error('Trekker is already initialized in this directory.');
        process.exit(1);
      }

      initProject();
      success('Trekker initialized successfully.');
    } catch (err) {
      handleCommandError(err);
    }
  });
