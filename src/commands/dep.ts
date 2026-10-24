import { Command } from 'commander';
import { DependencyService } from '@/src/services/dependency';
import { Output } from '@/src/utils/output';

export const depCommand = new Command('dep').description('Manage task dependencies');

depCommand
  .command('add <task-id> <depends-on-id>')
  .description('Add a dependency (task-id depends on depends-on-id)')
  .action((taskId: string, dependsOnId: string) => {
    try {
      const dependency = DependencyService.addDependency(taskId, dependsOnId);

      if (Output.isToonMode()) {
        Output.print(dependency);
      } else {
        Output.success(`Dependency added: ${taskId} depends on ${dependsOnId}`);
      }
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

depCommand
  .command('remove <task-id> <depends-on-id>')
  .description('Remove a dependency')
  .action((taskId: string, dependsOnId: string) => {
    try {
      DependencyService.removeDependency(taskId, dependsOnId);
      Output.success(`Dependency removed: ${taskId} no longer depends on ${dependsOnId}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

depCommand
  .command('list <task-id>')
  .description('List dependencies for a task')
  .action((taskId: string) => {
    try {
      const { dependsOn, blocks } = DependencyService.getDependencies(taskId);

      if (Output.isToonMode()) {
        Output.print({ taskId, dependsOn, blocks });
      } else {
        console.log(`Dependencies for ${taskId}:`);
        console.log('\nDepends on:');
        console.log(Output.formatDependencyList(dependsOn, 'depends_on'));
        console.log('\nBlocks:');
        console.log(Output.formatDependencyList(blocks, 'blocks'));
      }
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
