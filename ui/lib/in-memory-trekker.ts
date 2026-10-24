import dayjs from 'dayjs';
import { createStore } from 'zustand/vanilla';

import type { EpicDetail, RankedRef, TaskComment, TaskDetail } from '@/ui/lib/detail-shapes.ts';
import type {
  ArchiveResult,
  EpicDraft,
  EpicGateway,
  EpicPatch,
  HistoryGateway,
  ItemGateway,
  ItemMove,
  ProjectGateway,
  SearchHit,
  TaskDraft,
  TaskGateway,
  TaskPatch,
} from '@/ui/lib/gateways.ts';
import type { Gateways } from '@/ui/lib/services.ts';
import {
  type FieldChange,
  type HistoryAction,
  type HistoryEntity,
  type HistoryEvent,
  type HistoryQuery,
  HistoryShapes,
} from '@/ui/lib/history-shapes.ts';
import { ItemQueries, type ItemQuery } from '@/ui/lib/item-queries.ts';
import type { ItemRef, ItemSummary, Page } from '@/ui/lib/item-shapes.ts';
import { type ItemStatus, ItemStatuses } from '@/ui/lib/item-statuses.ts';
import type { Priority } from '@/ui/lib/priorities.ts';
import type { ProjectInfo } from '@/ui/lib/project-shapes.ts';
import type { SearchQuery } from '@/ui/lib/search-queries.ts';
import type { EventStream, LiveStatus, StreamListener } from '@/ui/lib/server-events.ts';
import { TextQueries } from '@/ui/lib/text-queries.ts';

interface StoredItem extends ItemSummary {
  description: string | null;
  order: number;
}

interface SeedItemFields extends Pick<
  StoredItem,
  'kind' | 'id' | 'title' | 'status' | 'priority' | 'tags' | 'epic' | 'parent' | 'order'
> {
  index: number;
}

interface StoredDependency {
  taskId: string;
  dependsOnId: string;
}

export interface SeedOptions {
  epics: number;
  tasks: number;
  subtasksPerTask: number;
  comments: number;
  events: number;
}

const TITLES = [
  'Event feed and SSE with replay after reconnect',
  'trekker serve command and REST API',
  'Keyset pagination for board columns',
  'Search crashes on unbalanced quotes in FTS query',
  'Pagination defaults to 50 rows in every list command',
  'Support Windows paths in the static file server',
  'Port fallback when 3000 is busy',
  'Virtualize the history page and add load more',
  'Drag cards between board columns to change status',
  'Show blocked tasks with their open dependencies',
  'Task detail page with comments and activity',
  'Epic detail page with progress by status',
  'Embed Google Sans Flex and Google Sans Code',
  'Map Bootstrap 6 tokens into the Tailwind theme',
  'Archive completed tasks older than 30 days',
  'Inline editing of task title and description',
  'Keyboard shortcut to open search',
  'Live indicator reconnects after laptop sleep',
  'Seed 10k tickets for benchmarks',
  'Export history as CSV for the weekly report',
];

const EPIC_TITLES = [
  'Dashboard rewrite',
  'Scale testing at 10k tickets',
  'CLI polish',
  'Agent plugins',
  'Release automation',
];

const TAGS = [['backend'], ['ui'], ['bug', 'search'], ['performance'], [], ['cli'], ['docs'], []];

const DESCRIPTION = [
  'The old dashboard rescanned every task every 2s. Replace it with a feed that reads only new rows.',
  '',
  '- One `EventFeed` per server process',
  '- Read `events WHERE id > last` after `PRAGMA data_version` changes',
  '',
  'Done when an idle tick costs under 1ms at 10k tickets.',
].join('\n');

const PRIORITY_CYCLE: Priority[] = [2, 1, 3, 2, 0, 4, 2, 5, 1, 3];
const TASK_STATUS_CYCLE: ItemStatus[] = [
  'completed',
  'todo',
  'completed',
  'todo',
  'in_progress',
  'completed',
  'wont_fix',
  'todo',
  'archived',
  'completed',
];
const EPIC_STATUS_CYCLE: ItemStatus[] = ['in_progress', 'todo', 'completed', 'todo', 'archived'];

const HOUR_MS = 3_600_000;
const BASE_TIME = dayjs('2026-10-24T12:00:00Z').valueOf();

export class InMemoryEventStream implements EventStream {
  readonly status = createStore<LiveStatus>()(() => {
    return { state: 'live' };
  });

  private readonly listeners = new Set<StreamListener>();

  subscribe(listener: StreamListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  ready() {
    return Promise.resolve();
  }

  publish(event: HistoryEvent) {
    for (const listener of this.listeners) {
      listener({ kind: 'event', event });
    }
  }
}

export class InMemoryTrekker {
  static readonly defaultSeed: SeedOptions = {
    epics: 12,
    tasks: 600,
    subtasksPerTask: 2,
    comments: 6,
    events: 400,
  };

  readonly stream = new InMemoryEventStream();
  readonly items = new Map<string, StoredItem>();
  readonly comments: TaskComment[] = [];
  readonly dependencies: StoredDependency[] = [];
  readonly events: HistoryEvent[] = [];
  latencyMs = 0;
  private nextTaskNumber = 1;
  private nextEpicNumber = 1;
  private nextCommentNumber = 1;
  private nextEventId = 1;
  private now = BASE_TIME;

  constructor(seed: SeedOptions = InMemoryTrekker.defaultSeed) {
    this.seed(seed);
  }

  private static pick<T>(values: readonly T[], index: number): T {
    const value = values[index % values.length];
    if (value === undefined) {
      throw new Error('empty seed list');
    }
    return value;
  }

  private static rankOf(order: number) {
    return `r${(2e12 + order).toFixed(6)}`;
  }

  private static seededChanges(action: HistoryAction, item: StoredItem) {
    if (action !== 'update') {
      return null;
    }
    return {
      status: { from: 'todo', to: item.status },
      priority: { from: 3, to: item.priority },
    };
  }

  private static ref(item: ItemSummary): ItemRef {
    return { id: item.id, title: item.title, status: item.status };
  }

  private static page<T>(rows: T[], cursor: string | null, limit: number): Page<T> {
    const offset = cursor ? Number(cursor) : 0;
    const items = rows.slice(offset, offset + limit);
    const next = offset + limit;
    return { items, total: rows.length, nextCursor: next < rows.length ? String(next) : null };
  }

  gateways(): Gateways {
    return {
      items: new InMemoryItemGateway(this),
      tasks: new InMemoryTaskGateway(this),
      epics: new InMemoryEpicGateway(this),
      history: new InMemoryHistoryGateway(this),
      project: new InMemoryProjectGateway(this),
      events: this.stream,
    };
  }

  async settle<T>(value: () => T): Promise<T> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, this.latencyMs);
      });
    }
    return value();
  }

  find(id: string) {
    const item = this.items.get(id);
    if (!item) {
      throw new Error(`${id} not found`);
    }
    return item;
  }

  list(query: ItemQuery, cursor: string | null, limit = ItemQueries.pageSize) {
    const rows = [...this.items.values()]
      .filter((item) => {
        if (query.types.length === 0 && item.kind === 'subtask' && !query.parentId) {
          return false;
        }
        return ItemQueries.matches(query, item);
      })
      .sort(ItemQueries.compare(query.sort));
    return InMemoryTrekker.page(rows.map(this.summarize), cursor, limit);
  }

  search(query: SearchQuery, cursor: string | null) {
    const rows = [...this.items.values()]
      .filter((item) => {
        if (query.types.length > 0 && !query.types.includes(item.kind)) {
          return false;
        }
        return TextQueries.matches(query.text, `${item.id} ${item.title}`);
      })
      .map((item): SearchHit => {
        return { ...this.summarize(item), snippet: null };
      });
    return InMemoryTrekker.page(rows, cursor, ItemQueries.pageSize);
  }

  summarize = (item: StoredItem): ItemSummary => {
    const { description: _description, order: _order, ...summary } = item;
    return { ...summary, ...this.tallies(item) };
  };

  taskDetail(id: string): TaskDetail {
    const item = this.find(id);
    const subtaskList: RankedRef[] = [...this.items.values()]
      .filter((other) => {
        return other.parent?.id === id;
      })
      .map((other) => {
        return { ...InMemoryTrekker.ref(other), priority: other.priority };
      });
    const dependsOn = this.dependencies
      .filter((dependency) => {
        return dependency.taskId === id;
      })
      .map((dependency) => {
        return InMemoryTrekker.ref(this.find(dependency.dependsOnId));
      });
    const blocks = this.dependencies
      .filter((dependency) => {
        return dependency.dependsOnId === id;
      })
      .map((dependency) => {
        return InMemoryTrekker.ref(this.find(dependency.taskId));
      });
    return {
      ...this.summarize(item),
      description: item.description,
      subtaskList,
      dependsOn,
      blocks,
    };
  }

  epicDetail(id: string): EpicDetail {
    const item = this.find(id);
    const statusCounts: Record<ItemStatus, number> = {
      todo: 0,
      in_progress: 0,
      completed: 0,
      wont_fix: 0,
      archived: 0,
    };
    for (const other of this.items.values()) {
      if (other.epic?.id === id && other.kind === 'task') {
        statusCounts[other.status] += 1;
      }
    }
    return { ...this.summarize(item), description: item.description, statusCounts };
  }

  createTask(draft: TaskDraft) {
    const parent = draft.parentTaskId ? this.find(draft.parentTaskId) : null;
    const epicId = draft.epicId ?? parent?.epic?.id ?? null;
    const item = this.store({
      kind: parent ? 'subtask' : 'task',
      id: `TREK-${String(this.nextTaskNumber)}`,
      title: draft.title,
      description: draft.description,
      status: draft.status,
      priority: draft.priority,
      tags: draft.tags,
      epic: epicId ? InMemoryTrekker.ref(this.find(epicId)) : null,
      parent: parent ? InMemoryTrekker.ref(parent) : null,
    });
    this.nextTaskNumber += 1;
    this.record('create', item.kind, item.id, item.id, item.title, { title: item.title }, null);
    return this.taskDetail(item.id);
  }

  createEpic(draft: EpicDraft) {
    const item = this.store({
      kind: 'epic',
      id: `EPIC-${String(this.nextEpicNumber)}`,
      title: draft.title,
      description: draft.description,
      status: draft.status,
      priority: draft.priority,
      tags: [],
      epic: null,
      parent: null,
    });
    this.nextEpicNumber += 1;
    this.record('create', 'epic', item.id, null, item.title, { title: item.title }, null);
    return this.epicDetail(item.id);
  }

  updateItem(id: string, patch: TaskPatch | EpicPatch) {
    const item = this.find(id);
    const changes: Record<string, FieldChange> = {};
    const next: StoredItem = { ...item };
    if (patch.title !== undefined && patch.title !== item.title) {
      changes.title = { from: item.title, to: patch.title };
      next.title = patch.title;
    }
    if (patch.description !== undefined && patch.description !== item.description) {
      changes.description = { from: item.description, to: patch.description };
      next.description = patch.description;
    }
    if (patch.status !== undefined && patch.status !== item.status) {
      changes.status = { from: item.status, to: patch.status };
      next.status = patch.status;
    }
    if (patch.priority !== undefined && patch.priority !== item.priority) {
      changes.priority = { from: item.priority, to: patch.priority };
      next.priority = patch.priority;
    }
    if ('epicId' in patch && patch.epicId !== undefined) {
      changes.epic_id = { from: item.epic?.id ?? null, to: patch.epicId };
      next.epic = patch.epicId ? InMemoryTrekker.ref(this.find(patch.epicId)) : null;
    }
    if ('tags' in patch && patch.tags !== undefined) {
      changes.tags = { from: item.tags.join(','), to: patch.tags.join(',') };
      next.tags = patch.tags;
    }
    next.updatedAt = this.tick();
    this.items.set(id, next);
    const taskId = next.kind === 'epic' ? null : id;
    this.record('update', next.kind, id, taskId, next.title, null, changes);
  }

  move(id: string, move: ItemMove) {
    const item = this.find(id);
    const column = [...this.items.values()]
      .filter((other) => {
        return other.status === move.status && other.id !== id && other.kind !== 'subtask';
      })
      .sort((left, right) => {
        return left.order - right.order;
      });
    const anchorIndex = column.findIndex((other) => {
      return other.id === move.anchorId;
    });
    let before: StoredItem | undefined;
    let after: StoredItem | undefined;
    if (anchorIndex === -1) {
      after = column[0];
    } else if (move.placement === 'before') {
      before = column[anchorIndex - 1];
      after = column[anchorIndex];
    } else {
      before = column[anchorIndex];
      after = column[anchorIndex + 1];
    }
    const low = before?.order ?? (after ? after.order - 2 : 0);
    const high = after?.order ?? low + 2;
    const order = (low + high) / 2;
    if (item.status !== move.status) {
      this.updateItem(id, { status: move.status });
    }
    const current = this.find(id);
    this.items.set(id, { ...current, order, rank: InMemoryTrekker.rankOf(order) });
    this.record('update', current.kind, id, id, current.title, null, {});
    return this.summarize(this.find(id));
  }

  removeItem(id: string) {
    const item = this.find(id);
    this.items.delete(id);
    this.record('delete', item.kind, id, item.kind === 'epic' ? null : id, item.title, null, null);
  }

  addComment(taskId: string, author: string, content: string) {
    const at = this.tick();
    const comment: TaskComment = {
      id: `CMT-${String(this.nextCommentNumber)}`,
      taskId,
      author,
      content,
      createdAt: at,
      updatedAt: at,
    };
    this.nextCommentNumber += 1;
    this.comments.push(comment);
    this.record('create', 'comment', comment.id, taskId, this.find(taskId).title, { taskId }, null);
    return comment;
  }

  updateComment(id: string, content: string) {
    const comment = this.comments.find((entry) => {
      return entry.id === id;
    });
    if (!comment) {
      throw new Error(`${id} not found`);
    }
    const from = comment.content;
    comment.content = content;
    comment.updatedAt = this.tick();
    this.record('update', 'comment', id, comment.taskId, null, null, {
      content: { from, to: content },
    });
    return { ...comment };
  }

  removeComment(id: string) {
    const index = this.comments.findIndex((entry) => {
      return entry.id === id;
    });
    const [comment] = this.comments.splice(index, 1);
    if (comment) {
      this.record('delete', 'comment', id, comment.taskId, null, { taskId: comment.taskId }, null);
    }
  }

  link(taskId: string, dependsOnId: string) {
    this.dependencies.push({ taskId, dependsOnId });
    this.record(
      'create',
      'dependency',
      `${taskId}:${dependsOnId}`,
      taskId,
      null,
      {
        taskId,
        dependsOnId,
      },
      null
    );
  }

  unlink(taskId: string, dependsOnId: string) {
    const index = this.dependencies.findIndex((dependency) => {
      return dependency.taskId === taskId && dependency.dependsOnId === dependsOnId;
    });
    if (index !== -1) {
      this.dependencies.splice(index, 1);
      this.record(
        'delete',
        'dependency',
        `${taskId}:${dependsOnId}`,
        taskId,
        null,
        {
          taskId,
          dependsOnId,
        },
        null
      );
    }
  }

  history(query: HistoryQuery, cursor: string | null) {
    const rows = [...this.events].reverse().filter((event) => {
      return HistoryShapes.matches(query, event);
    });
    return InMemoryTrekker.page(rows, cursor, ItemQueries.pageSize);
  }

  project(): ProjectInfo {
    let epics = 0;
    let tasks = 0;
    let subtasks = 0;
    for (const item of this.items.values()) {
      if (item.kind === 'epic') {
        epics += 1;
      } else if (item.kind === 'task') {
        tasks += 1;
      } else {
        subtasks += 1;
      }
    }
    return {
      name: 'trekker',
      root: '~/workspace/trekker',
      version: '1.12.0',
      config: { task_prefix: 'TREK', epic_prefix: 'EPIC', comment_prefix: 'CMT' },
      counts: { epics, tasks, subtasks },
    };
  }

  archiveCompleted(): ArchiveResult {
    let tasks = 0;
    let epics = 0;
    for (const item of [...this.items.values()]) {
      if (item.status === 'completed') {
        this.updateItem(item.id, { status: 'archived' });
        if (item.kind === 'epic') {
          epics += 1;
        } else {
          tasks += 1;
        }
      }
    }
    return { tasks, epics };
  }

  private tallies(item: StoredItem) {
    let total = 0;
    let done = 0;
    let progressTotal = 0;
    let progressDone = 0;
    for (const other of this.items.values()) {
      if (other.parent?.id === item.id) {
        total += 1;
        done += ItemStatuses.isDone(other.status) ? 1 : 0;
      }
      if (item.kind === 'epic' && other.epic?.id === item.id && other.kind === 'task') {
        progressTotal += 1;
        progressDone += ItemStatuses.isDone(other.status) ? 1 : 0;
      }
    }
    const blockedBy = this.dependencies.filter((dependency) => {
      if (dependency.taskId !== item.id) {
        return false;
      }
      const blocker = this.items.get(dependency.dependsOnId);
      return blocker !== undefined && !ItemStatuses.isDone(blocker.status);
    }).length;
    const commentCount = this.comments.filter((comment) => {
      return comment.taskId === item.id;
    }).length;
    return {
      subtasks: { total, done },
      progress: item.kind === 'epic' ? { total: progressTotal, done: progressDone } : null,
      blockedBy,
      commentCount,
    };
  }

  private store(
    fields: Pick<
      StoredItem,
      'kind' | 'id' | 'title' | 'description' | 'status' | 'priority' | 'tags' | 'epic' | 'parent'
    >
  ) {
    const lowest = Math.min(
      0,
      ...[...this.items.values()].map((item) => {
        return item.order;
      })
    );
    const order = lowest - 1;
    const at = this.tick();
    const item: StoredItem = {
      ...fields,
      order,
      rank: InMemoryTrekker.rankOf(order),
      subtasks: { total: 0, done: 0 },
      blockedBy: 0,
      progress: null,
      commentCount: 0,
      createdAt: at,
      updatedAt: at,
    };
    this.items.set(item.id, item);
    return item;
  }

  private record(
    action: HistoryAction,
    entityType: HistoryEntity,
    entityId: string,
    taskId: string | null,
    title: string | null,
    snapshot: Record<string, unknown> | null,
    changes: Record<string, FieldChange> | null
  ) {
    const event: HistoryEvent = {
      id: this.nextEventId,
      action,
      entityType,
      entityId,
      taskId,
      title,
      relatedIds: this.relatedIdsOf(entityType, entityId, taskId, snapshot),
      snapshot,
      changes,
      createdAt: this.tick(),
    };
    this.nextEventId += 1;
    this.events.push(event);
    this.stream.publish(event);
  }

  private relatedIdsOf(
    entityType: HistoryEntity,
    entityId: string,
    taskId: string | null,
    snapshot: Record<string, unknown> | null
  ) {
    const related = new Set<string>();
    const item = this.items.get(entityId);
    for (const value of [
      taskId,
      item?.epic?.id,
      item?.parent?.id,
      snapshot?.taskId,
      snapshot?.dependsOnId,
    ]) {
      if (typeof value === 'string' && value !== entityId) {
        related.add(value);
      }
    }
    if (entityType === 'task' || entityType === 'subtask') {
      for (const dependency of this.dependencies) {
        if (dependency.dependsOnId === entityId) {
          related.add(dependency.taskId);
        }
      }
    }
    return [...related];
  }

  private tick() {
    this.now += 1000;
    return this.now;
  }

  private seed(options: SeedOptions) {
    const total = options.epics + options.tasks * (1 + options.subtasksPerTask);
    this.now = BASE_TIME - total * HOUR_MS;
    let order = 0;
    const epicIds: string[] = [];
    for (let index = 0; index < options.epics; index += 1) {
      order += 1;
      const id = `EPIC-${String(this.nextEpicNumber)}`;
      this.nextEpicNumber += 1;
      epicIds.push(id);
      this.seedItem({
        kind: 'epic',
        id,
        title: InMemoryTrekker.pick(EPIC_TITLES, index),
        status: InMemoryTrekker.pick(EPIC_STATUS_CYCLE, index),
        priority: InMemoryTrekker.pick(PRIORITY_CYCLE, index),
        tags: [],
        epic: null,
        parent: null,
        order,
        index,
      });
    }
    for (let index = 0; index < options.tasks; index += 1) {
      order += 1;
      const id = `TREK-${String(this.nextTaskNumber)}`;
      this.nextTaskNumber += 1;
      const epicId = index % 3 === 0 ? null : (epicIds[index % epicIds.length] ?? null);
      const epic = epicId ? InMemoryTrekker.ref(this.find(epicId)) : null;
      const task = this.seedItem({
        kind: 'task',
        id,
        title: InMemoryTrekker.pick(TITLES, index * 7),
        status: InMemoryTrekker.pick(TASK_STATUS_CYCLE, index),
        priority: InMemoryTrekker.pick(PRIORITY_CYCLE, index * 3),
        tags: InMemoryTrekker.pick(TAGS, index),
        epic,
        parent: null,
        order,
        index,
      });
      for (let child = 0; child < options.subtasksPerTask && index % 4 === 1; child += 1) {
        order += 1;
        const subtaskId = `TREK-${String(this.nextTaskNumber)}`;
        this.nextTaskNumber += 1;
        this.seedItem({
          kind: 'subtask',
          id: subtaskId,
          title: InMemoryTrekker.pick(TITLES, index + child + 3),
          status: InMemoryTrekker.pick(TASK_STATUS_CYCLE, index + child),
          priority: InMemoryTrekker.pick(PRIORITY_CYCLE, index + child),
          tags: [],
          epic,
          parent: InMemoryTrekker.ref(task),
          order,
          index,
        });
      }
      if (index % 9 === 4 && index > 9) {
        this.dependencies.push({ taskId: id, dependsOnId: `TREK-${String(index - 5)}` });
      }
    }
    const taskIds = [...this.items.values()]
      .filter((item) => {
        return item.kind === 'task';
      })
      .map((item) => {
        return item.id;
      });
    for (let index = 0; index < options.comments * 20; index += 1) {
      const taskId = InMemoryTrekker.pick(taskIds, index * 13);
      const at = this.tick();
      this.comments.push({
        id: `CMT-${String(this.nextCommentNumber)}`,
        taskId,
        author: index % 3 === 0 ? 'omercan' : 'agent',
        content: InMemoryTrekker.pick(
          [
            'Started with a 250ms `data_version` check. Idle cost is 0.02ms on the 10k sandbox.',
            'Make sure a laptop waking from sleep gets the missed events, not a full reload.',
            'Added `?after=<id>` replay capped at 2000 rows.',
          ],
          index
        ),
        createdAt: at,
        updatedAt: at,
      });
      this.nextCommentNumber += 1;
    }
    const seededItems = [...this.items.values()];
    for (let index = 0; index < options.events; index += 1) {
      const item = InMemoryTrekker.pick(seededItems, index * 17);
      const action: HistoryAction = index % 5 === 0 ? 'create' : 'update';
      this.events.push({
        id: this.nextEventId,
        action,
        entityType: item.kind,
        entityId: item.id,
        taskId: item.kind === 'epic' ? null : item.id,
        title: item.title,
        relatedIds: [],
        snapshot: action === 'create' ? { title: item.title } : null,
        changes: InMemoryTrekker.seededChanges(action, item),
        createdAt: BASE_TIME - (options.events - index) * HOUR_MS,
      });
      this.nextEventId += 1;
    }
    this.now = BASE_TIME;
  }

  private seedItem(fields: SeedItemFields) {
    const { index, ...rest } = fields;
    const at = BASE_TIME - (index + 1) * HOUR_MS;
    const item: StoredItem = {
      ...rest,
      description: index % 2 === 0 ? DESCRIPTION : null,
      rank: InMemoryTrekker.rankOf(rest.order),
      subtasks: { total: 0, done: 0 },
      blockedBy: 0,
      progress: null,
      commentCount: 0,
      createdAt: at - HOUR_MS * 24,
      updatedAt: at,
    };
    this.items.set(item.id, item);
    return item;
  }
}

class InMemoryItemGateway implements ItemGateway {
  private readonly db: InMemoryTrekker;

  constructor(db: InMemoryTrekker) {
    this.db = db;
  }

  list(query: ItemQuery, cursor: string | null) {
    return this.db.settle(() => {
      return this.db.list(query, cursor);
    });
  }

  count(query: ItemQuery) {
    return this.db.settle(() => {
      return this.db.list(query, null).total;
    });
  }

  byIds(ids: string[]) {
    return this.db.settle(() => {
      return ids
        .filter((id) => {
          return this.db.items.has(id);
        })
        .map((id) => {
          return this.db.summarize(this.db.find(id));
        });
    });
  }

  search(query: SearchQuery, cursor: string | null) {
    return this.db.settle(() => {
      return this.db.search(query, cursor);
    });
  }

  move(id: string, move: ItemMove) {
    return this.db.settle(() => {
      return this.db.move(id, move);
    });
  }

  archiveCompleted() {
    return this.db.settle(() => {
      return this.db.archiveCompleted();
    });
  }
}

class InMemoryTaskGateway implements TaskGateway {
  private readonly db: InMemoryTrekker;

  constructor(db: InMemoryTrekker) {
    this.db = db;
  }

  get(id: string) {
    return this.db.settle(() => {
      return this.db.taskDetail(id);
    });
  }

  create(draft: TaskDraft) {
    return this.db.settle(() => {
      return this.db.createTask(draft);
    });
  }

  update(id: string, patch: TaskPatch) {
    return this.db.settle(() => {
      this.db.updateItem(id, patch);
      return this.db.taskDetail(id);
    });
  }

  remove(id: string) {
    return this.db.settle(() => {
      this.db.removeItem(id);
    });
  }

  comments(taskId: string, cursor: string | null) {
    return this.db.settle(() => {
      const thread = this.db.comments.filter((comment) => {
        return comment.taskId === taskId;
      });
      const offset = cursor ? Number(cursor) : 0;
      const items = thread.slice(offset, offset + ItemQueries.pageSize);
      const next = offset + ItemQueries.pageSize;
      return {
        items,
        total: thread.length,
        nextCursor: next < thread.length ? String(next) : null,
      };
    });
  }

  addComment(taskId: string, author: string, content: string) {
    return this.db.settle(() => {
      return this.db.addComment(taskId, author, content);
    });
  }

  updateComment(id: string, content: string) {
    return this.db.settle(() => {
      return this.db.updateComment(id, content);
    });
  }

  removeComment(id: string) {
    return this.db.settle(() => {
      this.db.removeComment(id);
    });
  }

  addDependency(taskId: string, dependsOnId: string) {
    return this.db.settle(() => {
      this.db.link(taskId, dependsOnId);
      return this.db.taskDetail(taskId);
    });
  }

  removeDependency(taskId: string, dependsOnId: string) {
    return this.db.settle(() => {
      this.db.unlink(taskId, dependsOnId);
      return this.db.taskDetail(taskId);
    });
  }
}

class InMemoryEpicGateway implements EpicGateway {
  private readonly db: InMemoryTrekker;

  constructor(db: InMemoryTrekker) {
    this.db = db;
  }

  get(id: string) {
    return this.db.settle(() => {
      return this.db.epicDetail(id);
    });
  }

  create(draft: EpicDraft) {
    return this.db.settle(() => {
      return this.db.createEpic(draft);
    });
  }

  update(id: string, patch: EpicPatch) {
    return this.db.settle(() => {
      this.db.updateItem(id, patch);
      return this.db.epicDetail(id);
    });
  }

  remove(id: string) {
    return this.db.settle(() => {
      this.db.removeItem(id);
    });
  }
}

class InMemoryHistoryGateway implements HistoryGateway {
  private readonly db: InMemoryTrekker;

  constructor(db: InMemoryTrekker) {
    this.db = db;
  }

  list(query: HistoryQuery, cursor: string | null) {
    return this.db.settle(() => {
      return this.db.history(query, cursor);
    });
  }
}

class InMemoryProjectGateway implements ProjectGateway {
  private readonly db: InMemoryTrekker;

  constructor(db: InMemoryTrekker) {
    this.db = db;
  }

  load() {
    return this.db.settle(() => {
      return this.db.project();
    });
  }

  updateConfig(config: Record<string, string>) {
    return this.db.settle(() => {
      const project = this.db.project();
      return { ...project, config: { ...project.config, ...config } };
    });
  }
}
