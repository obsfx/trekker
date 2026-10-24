import { Command } from 'commander';
import { DbClient } from '@/src/db/client';
import { ProjectService } from '@/src/services/project';
import { Output } from '@/src/utils/output';
import * as readline from 'node:readline';
import type { WipeCommandOptions } from '@/src/types/options';

abstract class WipePrompt {
  static confirm(prompt: string): Promise<boolean> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }
}

export const wipeCommand = new Command('wipe')
  .description('Delete all Trekker data in the current directory')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (options: WipeCommandOptions) => {
    try {
      if (!DbClient.isTrekkerInitialized()) {
        Output.error('Trekker is not initialized in this directory.');
        process.exit(1);
      }

      if (!options.yes) {
        const confirmed = await WipePrompt.confirm(
          'Are you sure you want to delete all Trekker data? This cannot be undone. (y/N): '
        );
        if (!confirmed) {
          console.log('Aborted.');
          return;
        }
      }

      ProjectService.wipeProject();
      Output.success('Trekker data deleted successfully.');
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
