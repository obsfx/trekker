import { createDb, isTrekkerInitialized, deleteDb } from '../db/client';
import { projects } from '../db/schema';
import { generateUuid } from '../utils/id-generator';
import { basename } from 'node:path';
import { resolveProjectConfig, setProjectConfigValues } from './config';
import type { ProjectConfigKey } from '../types';

export function initProject(
  cwd: string = process.cwd(),
  configOverrides?: Partial<Record<ProjectConfigKey, string>>
): void {
  if (isTrekkerInitialized(cwd)) {
    throw new Error('Trekker is already initialized in this directory.');
  }

  if (configOverrides) {
    resolveProjectConfig(configOverrides);
  }

  const db = createDb(cwd);
  const projectName = basename(cwd);
  const now = new Date();

  db.insert(projects)
    .values({
      id: generateUuid(),
      name: projectName,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  if (configOverrides) {
    setProjectConfigValues(configOverrides);
  }
}

export function wipeProject(cwd: string = process.cwd()): void {
  if (!isTrekkerInitialized(cwd)) {
    throw new Error('Trekker is not initialized in this directory.');
  }
  deleteDb(cwd);
}

export { isTrekkerInitialized };
