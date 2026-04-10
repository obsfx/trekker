import { Command } from 'commander';
import {
  assertProjectConfigKey,
  getProjectConfigValue,
  listProjectConfigEntries,
  listProjectConfig,
  setProjectConfigValues,
  unsetProjectConfigValue,
} from '../services/config';
import {
  handleCommandError,
  output,
  outputResult,
  formatProjectConfigList,
  success,
  isToonMode,
} from '../utils/output';

export const configCommand = new Command('config').description('Manage project configuration');

configCommand
  .command('list')
  .description('List supported project config values')
  .action(() => {
    try {
      if (isToonMode()) {
        output(listProjectConfig());
        return;
      }

      outputResult(listProjectConfigEntries(), formatProjectConfigList);
    } catch (err) {
      handleCommandError(err);
    }
  });

configCommand
  .command('get <key>')
  .description('Get a project config value')
  .action((key: string) => {
    try {
      assertProjectConfigKey(key);
      const value = getProjectConfigValue(key);

      if (isToonMode()) {
        output({ key, value });
        return;
      }

      console.log(value);
    } catch (err) {
      handleCommandError(err);
    }
  });

configCommand
  .command('set <key> <value>')
  .description('Set a project config value')
  .action((key: string, value: string) => {
    try {
      assertProjectConfigKey(key);
      const config = setProjectConfigValues({ [key]: value });
      success(`Config updated: ${key}=${config[key]}`, { key, value: config[key] });
    } catch (err) {
      handleCommandError(err);
    }
  });

configCommand
  .command('unset <key>')
  .description('Reset a project config value to its default')
  .action((key: string) => {
    try {
      assertProjectConfigKey(key);
      const value = unsetProjectConfigValue(key);
      success(`Config reset: ${key}=${value}`, { key, value });
    } catch (err) {
      handleCommandError(err);
    }
  });
