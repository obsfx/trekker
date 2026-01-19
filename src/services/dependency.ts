import { eq, or } from "drizzle-orm";
import { getDb } from "../db/client";
import { dependencies, tasks } from "../db/schema";
import { generateUuid } from "../utils/id-generator";
import type { Dependency } from "../types";

export function addDependency(taskId: string, dependsOnId: string): Dependency {
  const db = getDb();

  // Validate both tasks exist
  const task = db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const dependsOnTask = db
    .select()
    .from(tasks)
    .where(eq(tasks.id, dependsOnId))
    .get();
  if (!dependsOnTask) {
    throw new Error(`Task not found: ${dependsOnId}`);
  }

  // Can't depend on itself
  if (taskId === dependsOnId) {
    throw new Error("A task cannot depend on itself.");
  }

  // Check if dependency already exists
  const existing = db
    .select()
    .from(dependencies)
    .where(
      eq(dependencies.taskId, taskId)
    )
    .all()
    .find((d) => d.dependsOnId === dependsOnId);

  if (existing) {
    throw new Error(`Dependency already exists: ${taskId} → ${dependsOnId}`);
  }

  // Check for cycles
  if (wouldCreateCycle(taskId, dependsOnId)) {
    throw new Error(
      `Adding this dependency would create a cycle. ${dependsOnId} already depends on ${taskId} (directly or transitively).`
    );
  }

  const id = generateUuid();
  const now = new Date();

  const dependency = {
    id,
    taskId,
    dependsOnId,
    createdAt: now,
  };

  db.insert(dependencies).values(dependency).run();

  return dependency as Dependency;
}

export function removeDependency(taskId: string, dependsOnId: string): void {
  const db = getDb();

  const existing = db
    .select()
    .from(dependencies)
    .where(eq(dependencies.taskId, taskId))
    .all()
    .find((d) => d.dependsOnId === dependsOnId);

  if (!existing) {
    throw new Error(`Dependency not found: ${taskId} → ${dependsOnId}`);
  }

  db.delete(dependencies).where(eq(dependencies.id, existing.id)).run();
}

export function getDependencies(taskId: string): {
  dependsOn: Array<{ taskId: string; dependsOnId: string }>;
  blocks: Array<{ taskId: string; dependsOnId: string }>;
} {
  const db = getDb();

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

function wouldCreateCycle(taskId: string, dependsOnId: string): boolean {
  const db = getDb();

  // Use DFS to check if dependsOnId can reach taskId
  // If so, adding taskId → dependsOnId would create a cycle
  const visited = new Set<string>();
  const stack = [dependsOnId];

  while (stack.length > 0) {
    const current = stack.pop()!;

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

export function getAllDependencies(): Array<{
  taskId: string;
  dependsOnId: string;
}> {
  const db = getDb();
  return db
    .select({
      taskId: dependencies.taskId,
      dependsOnId: dependencies.dependsOnId,
    })
    .from(dependencies)
    .all();
}
