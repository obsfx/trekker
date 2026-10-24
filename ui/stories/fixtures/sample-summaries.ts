import dayjs from 'dayjs';

import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';

const UPDATED = dayjs('2026-10-24T11:40:00Z').valueOf();

export const SAMPLE_TASK_SUMMARY: ItemSummary = {
  kind: 'task',
  id: 'TREK-132',
  title: 'Event feed and SSE with replay after reconnect',
  status: 'in_progress',
  priority: 1,
  rank: 'a0',
  tags: ['backend', 'performance'],
  epic: { id: 'EPIC-20', title: 'Dashboard rewrite', status: 'in_progress' },
  parent: null,
  subtasks: { total: 4, done: 1 },
  blockedBy: 1,
  progress: null,
  commentCount: 3,
  createdAt: UPDATED - 86_400_000,
  updatedAt: UPDATED,
};

export const SAMPLE_EPIC_SUMMARY: ItemSummary = {
  ...SAMPLE_TASK_SUMMARY,
  kind: 'epic',
  id: 'EPIC-20',
  title: 'Dashboard rewrite: 10k scale, Storybook-first',
  tags: [],
  epic: null,
  subtasks: { total: 0, done: 0 },
  blockedBy: 0,
  progress: { total: 14, done: 3 },
  commentCount: 0,
};

export const SAMPLE_STATUS_COUNTS: Record<ItemStatus, number> = {
  todo: 8,
  in_progress: 3,
  completed: 4,
  wont_fix: 1,
  archived: 2,
};
