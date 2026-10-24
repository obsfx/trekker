import dayjs from 'dayjs';

import type { HistoryEvent } from '@/ui/lib/history-shapes.ts';

const BASE = dayjs('2026-10-24T14:32:00Z').valueOf();

export const STORY_HISTORY_EVENTS: HistoryEvent[] = [
  {
    id: 6,
    action: 'update',
    entityType: 'task',
    entityId: 'TREK-132',
    taskId: 'TREK-132',
    title: 'Event feed and SSE with replay after reconnect',
    relatedIds: [],
    snapshot: null,
    changes: {
      status: { from: 'todo', to: 'in_progress' },
      priority: { from: 2, to: 1 },
    },
    createdAt: BASE,
  },
  {
    id: 5,
    action: 'create',
    entityType: 'comment',
    entityId: 'CMT-41',
    taskId: 'TREK-132',
    title: 'Event feed and SSE with replay after reconnect',
    relatedIds: [],
    snapshot: {
      taskId: 'TREK-132',
      content: 'Replay works after sleep; the ready event carries lastEventId.',
    },
    changes: null,
    createdAt: BASE - 600_000,
  },
  {
    id: 4,
    action: 'create',
    entityType: 'dependency',
    entityId: 'DEP-9',
    taskId: 'TREK-132',
    title: 'Event feed and SSE with replay after reconnect',
    relatedIds: [],
    snapshot: { taskId: 'TREK-132', dependsOnId: 'TREK-131' },
    changes: null,
    createdAt: BASE - 1_800_000,
  },
  {
    id: 3,
    action: 'update',
    entityType: 'epic',
    entityId: 'EPIC-20',
    taskId: null,
    title: 'Dashboard rewrite',
    relatedIds: [],
    snapshot: null,
    changes: {
      description: { from: 'old', to: 'new' },
      title: { from: 'Dashboard', to: 'Dashboard rewrite' },
    },
    createdAt: BASE - 3_600_000,
  },
  {
    id: 2,
    action: 'delete',
    entityType: 'subtask',
    entityId: 'TREK-144',
    taskId: 'TREK-144',
    title: 'Send reset when too many events were missed',
    relatedIds: [],
    snapshot: { title: 'Send reset when too many events were missed' },
    changes: null,
    createdAt: BASE - 7_200_000,
  },
  {
    id: 1,
    action: 'create',
    entityType: 'task',
    entityId: 'TREK-131',
    taskId: 'TREK-131',
    title: 'trekker serve command and REST API',
    relatedIds: [],
    snapshot: { title: 'trekker serve command and REST API' },
    changes: null,
    createdAt: BASE - 90_000_000,
  },
];
