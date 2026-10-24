import dayjs from 'dayjs';
import { DbClient } from '@/src/db/client';
import { projects } from '@/src/db/schema';
import { IdGenerator } from '@/src/utils/id-generator';
import { basename } from 'node:path';
import { ConfigService } from '@/src/services/config';
import type { ProjectConfigKey } from '@/src/types';
import type { EntityCounts } from '@/src/types';

export abstract class ProjectService {
  static initProject(
    cwd: string = process.cwd(),
    configOverrides?: Partial<Record<ProjectConfigKey, string>>
  ): void {
    if (DbClient.isTrekkerInitialized(cwd)) {
      throw new Error('Trekker is already initialized in this directory.');
    }

    if (configOverrides) {
      ConfigService.resolveProjectConfig(configOverrides);
    }

    const db = DbClient.createDb(cwd);
    const projectName = basename(cwd);
    const now = dayjs().toDate();

    db.insert(projects)
      .values({
        id: IdGenerator.generateUuid(),
        name: projectName,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    if (configOverrides) {
      ConfigService.setProjectConfigValues(configOverrides);
    }
  }

  static wipeProject(cwd: string = process.cwd()): void {
    if (!DbClient.isTrekkerInitialized(cwd)) {
      throw new Error('Trekker is not initialized in this directory.');
    }
    DbClient.deleteDb(cwd);
  }

  static getProjectSummary(cwd: string = process.cwd()): ProjectSummary {
    const row = DbClient.requireSqliteInstance()
      .query<ProjectSummaryRow, []>(
        `SELECT
          (SELECT name FROM projects LIMIT 1) AS name,
          (SELECT COUNT(*) FROM epics) AS epics,
          (SELECT COUNT(*) FROM tasks WHERE parent_task_id IS NULL) AS tasks,
          (SELECT COUNT(*) FROM tasks WHERE parent_task_id IS NOT NULL) AS subtasks`
      )
      .get();
    return {
      name: row?.name ?? basename(cwd),
      counts: {
        epics: row?.epics ?? 0,
        tasks: row?.tasks ?? 0,
        subtasks: row?.subtasks ?? 0,
      },
    };
  }
}

export interface ProjectSummary {
  name: string;
  counts: EntityCounts;
}

interface ProjectSummaryRow {
  name: string | null;
  epics: number;
  tasks: number;
  subtasks: number;
}
