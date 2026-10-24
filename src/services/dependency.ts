import dayjs from 'dayjs';
import { eq } from 'drizzle-orm';
import { DbClient } from '@/src/db/client';
import { dependencies } from '@/src/db/schema';
import { IdGenerator } from '@/src/utils/id-generator';
import type { Dependency } from '@/src/types';
import type { DependencyLink } from '@/src/types';
import { TaskService } from '@/src/services/task';

interface DependencyLinks {
  dependsOn: DependencyLink[];
  blocks: DependencyLink[];
}

export abstract class DependencyService {
  private static findDependency(taskId: string, dependsOnId: string) {
    return DbClient.getDb()
      .select()
      .from(dependencies)
      .where(eq(dependencies.taskId, taskId))
      .all()
      .find((d) => {
        return d.dependsOnId === dependsOnId;
      });
  }

  static addDependency(taskId: string, dependsOnId: string): Dependency {
    const db = DbClient.getDb();

    TaskService.requireTask(taskId);
    TaskService.requireTask(dependsOnId);

    // Can't depend on itself
    if (taskId === dependsOnId) {
      throw new Error('A task cannot depend on itself.');
    }

    // Check if dependency already exists
    const existing = DependencyService.findDependency(taskId, dependsOnId);

    if (existing) {
      throw new Error(`Dependency already exists: ${taskId} depends on ${dependsOnId}`);
    }

    // Check for cycles
    if (DependencyService.wouldCreateCycle(taskId, dependsOnId)) {
      throw new Error(
        `Adding this dependency would create a cycle. ${dependsOnId} already depends on ${taskId} (directly or transitively).`
      );
    }

    const id = IdGenerator.generateUuid();
    const now = dayjs().toDate();

    const dependency = {
      id,
      taskId,
      dependsOnId,
      createdAt: now,
    };

    db.insert(dependencies).values(dependency).run();

    return dependency;
  }

  static removeDependency(taskId: string, dependsOnId: string): void {
    const db = DbClient.getDb();

    const existing = DependencyService.findDependency(taskId, dependsOnId);

    if (!existing) {
      throw new Error(`Dependency not found: ${taskId} does not depend on ${dependsOnId}`);
    }

    db.delete(dependencies).where(eq(dependencies.id, existing.id)).run();
  }

  static getDependencies(taskId: string): DependencyLinks {
    const db = DbClient.getDb();

    // Tasks that this task depends on
    const dependsOn = db
      .select({
        taskId: dependencies.taskId,
        dependsOnId: dependencies.dependsOnId,
      })
      .from(dependencies)
      .where(eq(dependencies.taskId, taskId))
      .all();

    // Tasks that are blocked by this task
    const blocks = db
      .select({
        taskId: dependencies.taskId,
        dependsOnId: dependencies.dependsOnId,
      })
      .from(dependencies)
      .where(eq(dependencies.dependsOnId, taskId))
      .all();

    return { dependsOn, blocks };
  }

  private static wouldCreateCycle(taskId: string, dependsOnId: string): boolean {
    const db = DbClient.getDb();

    // Use DFS to check if dependsOnId can reach taskId
    // If so, adding taskId depends on dependsOnId would create a cycle
    const visited = new Set<string>();
    const stack = [dependsOnId];

    while (stack.length > 0) {
      const current = stack.pop();
      if (current === undefined) {
        continue;
      }

      if (current === taskId) {
        return true; // Found a path from dependsOnId to taskId
      }

      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      // Get all tasks that `current` depends on
      const deps = db
        .select({ dependsOnId: dependencies.dependsOnId })
        .from(dependencies)
        .where(eq(dependencies.taskId, current))
        .all();

      for (const dep of deps) {
        if (!visited.has(dep.dependsOnId)) {
          stack.push(dep.dependsOnId);
        }
      }
    }

    return false;
  }
}
