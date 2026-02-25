import { createDb, isTrekkerInitialized, deleteDb } from '../db/client';
import { projects } from '../db/schema';
import { generateUuid } from '../utils/id-generator';
import { basename } from 'node:path';

export function initProject(cwd: string = process.cwd()): void {
  if (isTrekkerInitialized(cwd)) {
    throw new Error('Trekker is already initialized in this directory.');
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
}

export function wipeProject(cwd: string = process.cwd()): void {
  if (!isTrekkerInitialized(cwd)) {
    throw new Error('Trekker is not initialized in this directory.');
  }
  deleteDb(cwd);
}

export { isTrekkerInitialized };
