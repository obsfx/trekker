import dayjs from 'dayjs';
import { eq, and, isNull, desc, sql, getTableColumns } from 'drizzle-orm';
import { DbClient } from '@/src/db/client';
import { epics, projects, tasks } from '@/src/db/schema';
import { IdGenerator } from '@/src/utils/id-generator';
import { Ranks } from '@/src/services/rank';
import type {
  Epic,
  CreateEpicInput,
  UpdateEpicInput,
  EpicStatus,
  PaginatedResponse,
} from '@/src/types';
import { DEFAULT_PRIORITY, DEFAULT_EPIC_STATUS, PAGINATION_DEFAULTS } from '@/src/types';
import type { ArchivedCounts } from '@/src/types';
import { UpdateFields } from '@/src/services/update-fields';

interface EpicListQuery {
  status?: EpicStatus;
  limit?: number;
  page?: number;
}

export abstract class EpicService {
  static createEpic(input: CreateEpicInput): Epic {
    const db = DbClient.getDb();

    const project = db.select().from(projects).get();
    if (!project) {
      throw new Error("Project not found. Run 'trekker init' first.");
    }

    const id = IdGenerator.generateId('epic');
    const now = dayjs().toDate();

    const epic = {
      id,
      projectId: project.id,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? DEFAULT_EPIC_STATUS,
      priority: input.priority ?? DEFAULT_PRIORITY,
      createdAt: now,
      updatedAt: now,
    };

    Ranks.insertWithFirstRank((rank) => {
      db.insert(epics)
        .values({ ...epic, rank })
        .run();
    });

    return epic;
  }

  static getEpic(id: string): Epic | undefined {
    const db = DbClient.getDb();
    return db.select(EPIC_COLUMNS).from(epics).where(eq(epics.id, id)).get();
  }

  static listEpics(options?: EpicListQuery): PaginatedResponse<Epic> {
    const db = DbClient.getDb();

    const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
    const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
    const offset = (page - 1) * limit;

    let where;
    if (options?.status) {
      where = eq(epics.status, options.status);
    }

    const countRow = db
      .select({ count: sql<number>`count(*)` })
      .from(epics)
      .where(where)
      .get();
    const total = countRow?.count ?? 0;

    const items = db
      .select(EPIC_COLUMNS)
      .from(epics)
      .where(where)
      .orderBy(desc(epics.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    return { total, page, limit, items };
  }

  static updateEpic(id: string, input: UpdateEpicInput): Epic {
    const db = DbClient.getDb();

    const existing = EpicService.getEpic(id);
    if (!existing) {
      throw new Error(`Epic not found: ${id}`);
    }

    const updates = UpdateFields.from(input, [
      'title',
      'description',
      'status',
      'priority',
      'rank',
    ]);

    db.update(epics).set(updates).where(eq(epics.id, id)).run();

    const updated = EpicService.getEpic(id);
    if (!updated) {
      throw new Error(`Epic not found after update: ${id}`);
    }
    return updated;
  }

  static deleteEpic(id: string): void {
    const db = DbClient.getDb();

    const existing = EpicService.getEpic(id);
    if (!existing) {
      throw new Error(`Epic not found: ${id}`);
    }

    db.delete(epics).where(eq(epics.id, id)).run();
  }

  static completeEpic(id: string): CompleteEpicResult {
    const db = DbClient.getDb();

    const existing = EpicService.getEpic(id);
    if (!existing) {
      throw new Error(`Epic not found: ${id}`);
    }

    if (existing.status === 'completed') {
      throw new Error(`Epic is already completed: ${id}`);
    }

    // Get all tasks under this epic (not subtasks)
    const epicTasks = db
      .select()
      .from(tasks)
      .where(and(eq(tasks.epicId, id), isNull(tasks.parentTaskId)))
      .all();

    const taskIds = epicTasks.map((t) => {
      return t.id;
    });

    // Get all subtasks of those tasks
    let subtaskCount = 0;
    if (taskIds.length > 0) {
      for (const taskId of taskIds) {
        const subtasks = db.select().from(tasks).where(eq(tasks.parentTaskId, taskId)).all();

        subtaskCount += subtasks.length;

        // Archive subtasks
        if (subtasks.length > 0) {
          db.update(tasks)
            .set({ status: 'archived', updatedAt: dayjs().toDate() })
            .where(eq(tasks.parentTaskId, taskId))
            .run();
        }
      }

      // Archive tasks
      db.update(tasks)
        .set({ status: 'archived', updatedAt: dayjs().toDate() })
        .where(and(eq(tasks.epicId, id), isNull(tasks.parentTaskId)))
        .run();
    }

    // Complete the epic
    db.update(epics)
      .set({ status: 'completed', updatedAt: dayjs().toDate() })
      .where(eq(epics.id, id))
      .run();

    return {
      epic: id,
      status: 'completed',
      archived: {
        tasks: taskIds.length,
        subtasks: subtaskCount,
      },
    };
  }
}

const { rank: _rank, ...EPIC_COLUMNS } = getTableColumns(epics);

interface CompleteEpicResult {
  epic: string;
  status: string;
  archived: ArchivedCounts;
}
