import { describe, expect, it } from 'vitest';

import { ItemQueries } from '@/ui/lib/item-queries.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';

abstract class SummaryFixture {
  static summary(overrides: Partial<ItemSummary>): ItemSummary {
    return {
      kind: 'task',
      id: 'TREK-1',
      title: 'Title',
      status: 'todo',
      priority: 2,
      rank: 'a0',
      tags: [],
      epic: null,
      parent: null,
      subtasks: { total: 0, done: 0 },
      blockedBy: 0,
      progress: null,
      commentCount: 0,
      createdAt: 0,
      updatedAt: 0,
      ...overrides,
    };
  }
}

describe('ItemQueries', () => {
  it('matches every filter that is set', () => {
    const query = {
      ...ItemQueries.empty(ItemQueries.recentSort),
      types: ['task' as const],
      statuses: ['todo' as const],
      epicId: 'EPIC-1',
    };
    const inEpic = SummaryFixture.summary({
      epic: { id: 'EPIC-1', title: 'Epic', status: 'todo' },
    });
    expect(ItemQueries.matches(query, inEpic)).toBe(true);
    expect(ItemQueries.matches(query, SummaryFixture.summary({}))).toBe(false);
    expect(ItemQueries.matches(query, { ...inEpic, status: 'completed' })).toBe(false);
    expect(ItemQueries.matches(query, { ...inEpic, kind: 'epic' })).toBe(false);
  });

  it('orders by rank with unranked items first and id as the tie break', () => {
    const compare = ItemQueries.compare(ItemQueries.manualSort);
    const items = [
      SummaryFixture.summary({ id: 'TREK-3', rank: 'b0' }),
      SummaryFixture.summary({ id: 'TREK-2', rank: null }),
      SummaryFixture.summary({ id: 'TREK-1', rank: 'a0' }),
      SummaryFixture.summary({ id: 'TREK-4', rank: 'a0' }),
    ].sort(compare);
    expect(
      items.map((item) => {
        return item.id;
      })
    ).toEqual(['TREK-2', 'TREK-1', 'TREK-4', 'TREK-3']);
  });

  it('sorts descending by updated time', () => {
    const compare = ItemQueries.compare(ItemQueries.recentSort);
    const items = [
      SummaryFixture.summary({ id: 'A', updatedAt: 1 }),
      SummaryFixture.summary({ id: 'B', updatedAt: 5 }),
    ].sort(compare);
    expect(items[0]?.id).toBe('B');
  });

  it('writes query params the server understands', () => {
    const query = {
      ...ItemQueries.empty(ItemQueries.manualSort),
      types: ['epic' as const, 'task' as const],
      statuses: ['in_progress' as const],
      priorities: [0 as const, 1 as const],
    };
    const params = ItemQueries.params(query, 'abc');
    expect(params.get('type')).toBe('epic,task');
    expect(params.get('status')).toBe('in_progress');
    expect(params.get('priority')).toBe('0,1');
    expect(params.get('sort')).toBe('rank:asc');
    expect(params.get('cursor')).toBe('abc');
    expect(params.get('limit')).toBe('50');
  });

  it('builds the same key regardless of filter order', () => {
    const left = {
      ...ItemQueries.empty(ItemQueries.recentSort),
      statuses: ['todo' as const, 'completed' as const],
    };
    const right = {
      ...ItemQueries.empty(ItemQueries.recentSort),
      statuses: ['completed' as const, 'todo' as const],
    };
    expect(ItemQueries.key(left)).toBe(ItemQueries.key(right));
  });

  it('matches items inside a date range with an exclusive end', () => {
    const query = {
      ...ItemQueries.empty(ItemQueries.recentSort),
      dates: { field: 'created' as const, from: 100, to: 200 },
    };
    expect(ItemQueries.matches(query, SummaryFixture.summary({ createdAt: 100 }))).toBe(true);
    expect(ItemQueries.matches(query, SummaryFixture.summary({ createdAt: 200 }))).toBe(false);
    expect(
      ItemQueries.matches(query, SummaryFixture.summary({ createdAt: 99, updatedAt: 150 }))
    ).toBe(false);
    expect(ItemQueries.params(query, null).get('dateField')).toBe('created');
  });

  it('orders titles by code unit like SQLite', () => {
    const compare = ItemQueries.compare({ field: 'title', direction: 'asc' });
    const items = [
      SummaryFixture.summary({ id: 'A', title: 'Add CSV output' }),
      SummaryFixture.summary({ id: 'B', title: 'Add CSV Z probe' }),
    ].sort(compare);
    expect(
      items.map((item) => {
        return item.id;
      })
    ).toEqual(['B', 'A']);
  });
});
