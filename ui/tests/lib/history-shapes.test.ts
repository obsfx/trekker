import { describe, expect, it } from 'vitest';

import { type HistoryEvent, HistoryShapes } from '@/ui/lib/history-shapes.ts';

abstract class HistoryEventFixture {
  static event(overrides: Partial<HistoryEvent>): HistoryEvent {
    return {
      id: 1,
      action: 'update',
      entityType: 'task',
      entityId: 'TREK-1',
      taskId: 'TREK-1',
      title: 'Title',
      relatedIds: [],
      snapshot: null,
      changes: { status: { from: 'todo', to: 'completed' } },
      createdAt: 0,
      ...overrides,
    };
  }
}

describe('HistoryShapes', () => {
  it('hides update events without changes', () => {
    expect(
      HistoryShapes.matches(HistoryShapes.emptyQuery, HistoryEventFixture.event({ changes: {} }))
    ).toBe(false);
    expect(HistoryShapes.matches(HistoryShapes.emptyQuery, HistoryEventFixture.event({}))).toBe(
      true
    );
  });

  it('matches an entity filter through the owning task', () => {
    const comment = HistoryEventFixture.event({
      entityType: 'comment',
      entityId: 'CMT-4',
      taskId: 'TREK-9',
      action: 'create',
    });
    expect(
      HistoryShapes.matches({ ...HistoryShapes.emptyQuery, entityId: 'TREK-9' }, comment)
    ).toBe(true);
  });

  it('collects every item a dependency event touches', () => {
    const dependency = HistoryEventFixture.event({
      entityType: 'dependency',
      entityId: 'DEP-1',
      action: 'create',
      taskId: 'TREK-2',
      snapshot: { taskId: 'TREK-2', dependsOnId: 'TREK-3' },
    });
    expect([...HistoryShapes.affectedIds(dependency)].sort()).toEqual(['TREK-2', 'TREK-3']);
  });

  it('parses wire events leniently', () => {
    expect(HistoryShapes.parse({ id: 'x' })).toBeNull();
    expect(
      HistoryShapes.parse({
        id: 3,
        action: 'create',
        entityType: 'epic',
        entityId: 'EPIC-1',
        createdAt: 10,
      })?.taskId
    ).toBeNull();
  });
});
