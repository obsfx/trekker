import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DesktopNotifications } from '@/ui/lib/desktop-notifications.ts';
import { InMemoryEventStream } from '@/ui/lib/in-memory-trekker.ts';

const base = {
  id: 1,
  entityId: 'TREK-7',
  taskId: 'TREK-7',
  title: 'Ship it',
  relatedIds: [],
  snapshot: null,
  createdAt: 0,
};

describe('DesktopNotifications', () => {
  it('describes creations and status changes only', () => {
    expect(
      DesktopNotifications.describe({
        ...base,
        action: 'create',
        entityType: 'task',
        changes: null,
      })
    ).toEqual({
      title: 'TREK-7 created',
      body: 'Ship it',
      path: '/tasks/TREK-7',
      change: 'created',
    });
    expect(
      DesktopNotifications.describe({
        ...base,
        action: 'update',
        entityType: 'task',
        changes: { status: { from: 'todo', to: 'completed' } },
      })?.title
    ).toBe('TREK-7 moved to Completed');
    expect(
      DesktopNotifications.describe({
        ...base,
        action: 'update',
        entityType: 'task',
        changes: { title: { from: 'a', to: 'b' } },
      })
    ).toBeNull();
    expect(
      DesktopNotifications.describe({
        ...base,
        action: 'create',
        entityType: 'comment',
        changes: null,
      })
    ).toBeNull();
  });

  describe('delivery', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('notifies only while enabled and hidden', () => {
      const stream = new InMemoryEventStream();
      const show = vi.fn();
      let hidden = false;
      const stop = new DesktopNotifications(stream, {
        enabled: () => {
          return true;
        },
        hidden: () => {
          return hidden;
        },
        show,
      }).start();
      const event = {
        ...base,
        action: 'create' as const,
        entityType: 'task' as const,
        changes: null,
      };
      stream.publish(event);
      vi.runAllTimers();
      expect(show).not.toHaveBeenCalled();
      hidden = true;
      stream.publish(event);
      vi.runAllTimers();
      expect(show).toHaveBeenCalledOnce();
      stop();
    });

    it('folds a burst of changes into one summary', () => {
      const stream = new InMemoryEventStream();
      const show = vi.fn();
      const stop = new DesktopNotifications(stream, {
        enabled: () => {
          return true;
        },
        hidden: () => {
          return true;
        },
        show,
      }).start();
      for (let id = 1; id <= 40; id += 1) {
        stream.publish({
          ...base,
          id,
          entityId: `TREK-${String(id)}`,
          action: 'create',
          entityType: 'task',
          changes: null,
        });
      }
      vi.runAllTimers();
      expect(show).toHaveBeenCalledOnce();
      expect(show.mock.calls[0]?.[0]).toMatchObject({
        title: '40 changes in trekker',
        body: '40 created',
        path: '/history',
      });
      stop();
    });
  });
});
