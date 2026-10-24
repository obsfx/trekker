import { Command } from 'commander';
import { ConfigService } from '@/src/services/config';
import { Output } from '@/src/utils/output';

export const configCommand = new Command('config').description('Manage project configuration');

configCommand
  .command('list')
  .description('List supported project config values')
  .action(() => {
    try {
      if (Output.isToonMode()) {
        Output.print(ConfigService.listProjectConfig());
        return;
      }

      Output.outputResult(ConfigService.listProjectConfigEntries(), Output.formatProjectConfigList);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

configCommand
  .command('get <key>')
  .description('Get a project config value')
  .action((key: string) => {
    try {
      ConfigService.assertProjectConfigKey(key);
      const value = ConfigService.getProjectConfigValue(key);

      if (Output.isToonMode()) {
        Output.print({ key, value });
        return;
      }

      console.log(value);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

configCommand
  .command('set <key> <value>')
  .description('Set a project config value')
  .action((key: string, value: string) => {
    try {
      ConfigService.assertProjectConfigKey(key);
      const config = ConfigService.setProjectConfigValues({ [key]: value });
      Output.success(`Config updated: ${key}=${config[key]}`, { key, value: config[key] });
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

configCommand
  .command('unset <key>')
  .description('Reset a project config value to its default')
  .action((key: string) => {
    try {
      ConfigService.assertProjectConfigKey(key);
      const value = ConfigService.unsetProjectConfigValue(key);
      Output.success(`Config reset: ${key}=${value}`, { key, value });
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
