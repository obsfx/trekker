import dayjs from 'dayjs';
import { eq, and, isNull, desc, sql, getTableColumns, type SQL } from 'drizzle-orm';
import { DbClient } from '@/src/db/client';
import { tasks, projects, epics } from '@/src/db/schema';
import { IdGenerator } from '@/src/utils/id-generator';
import { Ranks } from '@/src/services/rank';
import { UpdateFields } from '@/src/services/update-fields';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  PaginatedResponse,
} from '@/src/types';
import { DEFAULT_PRIORITY, DEFAULT_TASK_STATUS, PAGINATION_DEFAULTS } from '@/src/types';
import type { PageQuery } from '@/src/types';

interface TaskListQuery {
  status?: TaskStatus;
  epicId?: string;
  parentTaskId?: string | null;
  limit?: number;
  page?: number;
}

export abstract class TaskService {
  private static requireEpic(epicId: string | null | undefined): void {
    if (!epicId) {
      return;
    }
    const epic = DbClient.getDb().select().from(epics).where(eq(epics.id, epicId)).get();
    if (!epic) {
      throw new Error(`Epic not found: ${epicId}`);
    }
  }

  private static pageTasks(
    where: SQL | undefined,
    page: number,
    limit: number
  ): PaginatedResponse<Task> {
    const db = DbClient.getDb();
    const offset = (page - 1) * limit;
    const countRow = db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(where)
      .get();
    const total = countRow?.count ?? 0;

    const items = db
      .select(TASK_COLUMNS)
      .from(tasks)
      .where(where)
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    return { total, page, limit, items };
  }

  static createTask(input: CreateTaskInput): Task {
    const db = DbClient.getDb();

    const project = db.select().from(projects).get();
    if (!project) {
      throw new Error("Project not found. Run 'trekker init' first.");
    }

    TaskService.requireEpic(input.epicId);

    let inheritedEpicId: string | null = null;
    if (input.parentTaskId) {
      const parent = db.select().from(tasks).where(eq(tasks.id, input.parentTaskId)).get();
      if (!parent) {
        throw new Error(`Parent task not found: ${input.parentTaskId}`);
      }
      inheritedEpicId = parent.epicId;
    }

    const id = IdGenerator.generateId('task');
    const now = dayjs().toDate();

    const task = {
      id,
      projectId: project.id,
      epicId: input.epicId ?? inheritedEpicId,
      parentTaskId: input.parentTaskId ?? null,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? DEFAULT_PRIORITY,
      status: input.status ?? DEFAULT_TASK_STATUS,
      tags: input.tags ?? null,
      createdAt: now,
      updatedAt: now,
    };

    Ranks.insertWithFirstRank((rank) => {
      db.insert(tasks)
        .values({ ...task, rank })
        .run();
    });

    return task;
  }

  static requireTask(id: string): Task {
    const task = TaskService.getTask(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }
    return task;
  }

  static getTask(id: string): Task | undefined {
    const db = DbClient.getDb();
    return db.select(TASK_COLUMNS).from(tasks).where(eq(tasks.id, id)).get();
  }

  static listTasks(options?: TaskListQuery): PaginatedResponse<Task> {
    const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
    const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;

    const conditions = [];

    if (options?.status) {
      conditions.push(eq(tasks.status, options.status));
    }

    if (options?.epicId) {
      conditions.push(eq(tasks.epicId, options.epicId));
    }

    // If parentTaskId is explicitly null, list only top-level tasks
    if (options?.parentTaskId === null) {
      conditions.push(isNull(tasks.parentTaskId));
    } else if (options?.parentTaskId) {
      conditions.push(eq(tasks.parentTaskId, options.parentTaskId));
    }

    let where;
    if (conditions.length > 0) {
      where = and(...conditions);
    }

    return TaskService.pageTasks(where, page, limit);
  }

  static listSubtasks(parentTaskId: string, options?: PageQuery): PaginatedResponse<Task> {
    const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
    const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
    return TaskService.pageTasks(eq(tasks.parentTaskId, parentTaskId), page, limit);
  }

  static updateTask(id: string, input: UpdateTaskInput): Task {
    const db = DbClient.getDb();

    const existing = TaskService.getTask(id);
    if (!existing) {
      throw new Error(`Task not found: ${id}`);
    }

    TaskService.requireEpic(input.epicId);

    const updates = UpdateFields.from(input, [
      'title',
      'description',
      'priority',
      'status',
      'tags',
      'epicId',
      'rank',
    ]);

    db.update(tasks).set(updates).where(eq(tasks.id, id)).run();

    const updated = TaskService.getTask(id);
    if (!updated) {
      throw new Error(`Task not found after update: ${id}`);
    }
    return updated;
  }

  static deleteTask(id: string): void {
    const db = DbClient.getDb();

    const existing = TaskService.getTask(id);
    if (!existing) {
      throw new Error(`Task not found: ${id}`);
    }

    db.transaction((tx) => {
      tx.delete(tasks).where(eq(tasks.parentTaskId, id)).run();
      tx.delete(tasks).where(eq(tasks.id, id)).run();
    });
  }
}

const { rank: _rank, ...TASK_COLUMNS } = getTableColumns(tasks);
