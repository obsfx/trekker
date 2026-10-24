import { DbClient } from '@/src/db/client';
import type { Priority, TaskStatus } from '@/src/types';
import { ItemsService } from '@/src/services/items';
import type { ItemRef, ItemSummary } from '@/src/services/items';

export abstract class ItemDetails {
  private static summaryOf(id: string): ItemSummary | undefined {
    return ItemsService.getItemSummaries([id]).at(0);
  }

  private static descriptionOf(table: 'epics' | 'tasks', id: string): string | null {
    const row = DbClient.requireSqliteInstance()
      .query<DescriptionRow, [string]>(`SELECT description FROM ${table} WHERE id = ?`)
      .get(id);
    return row?.description ?? null;
  }

  static getTaskDetail(id: string): TaskDetail | undefined {
    const summary = ItemDetails.summaryOf(id);
    if (!summary || summary.kind === 'epic') {
      return undefined;
    }
    const sqlite = DbClient.requireSqliteInstance();
    const subtaskList = sqlite
      .query<
        SubtaskRef,
        [string]
      >('SELECT id, title, status, priority FROM tasks WHERE parent_task_id = ? ORDER BY rowid')
      .all(id);
    const dependsOn = sqlite
      .query<ItemRef, [string]>(
        `SELECT t.id, t.title, t.status FROM dependencies d
         JOIN tasks t ON t.id = d.depends_on_id WHERE d.task_id = ? ORDER BY d.rowid`
      )
      .all(id);
    const blocks = sqlite
      .query<ItemRef, [string]>(
        `SELECT t.id, t.title, t.status FROM dependencies d
         JOIN tasks t ON t.id = d.task_id WHERE d.depends_on_id = ? ORDER BY d.rowid`
      )
      .all(id);

    return {
      ...summary,
      description: ItemDetails.descriptionOf('tasks', id),
      subtaskList,
      dependsOn,
      blocks,
    };
  }

  static getEpicDetail(id: string): EpicDetail | undefined {
    const summary = ItemDetails.summaryOf(id);
    if (summary?.kind !== 'epic') {
      return undefined;
    }
    const rows = DbClient.requireSqliteInstance()
      .query<StatusCountRow, [string]>(
        `SELECT status, COUNT(*) AS total FROM tasks
         WHERE epic_id = ? AND parent_task_id IS NULL GROUP BY status`
      )
      .all(id);
    const statusCounts: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      completed: 0,
      wont_fix: 0,
      archived: 0,
    };
    for (const row of rows) {
      statusCounts[row.status] = row.total;
    }

    return { ...summary, description: ItemDetails.descriptionOf('epics', id), statusCounts };
  }
}

export interface SubtaskRef extends ItemRef {
  priority: Priority;
}

export interface TaskDetail extends ItemSummary {
  description: string | null;
  subtaskList: SubtaskRef[];
  dependsOn: ItemRef[];
  blocks: ItemRef[];
}

export interface EpicDetail extends ItemSummary {
  description: string | null;
  statusCounts: Record<TaskStatus, number>;
}

interface DescriptionRow {
  description: string | null;
}

interface StatusCountRow {
  status: TaskStatus;
  total: number;
}
