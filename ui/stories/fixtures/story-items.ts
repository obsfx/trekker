import dayjs from 'dayjs';

import { InMemoryTrekker } from '@/ui/lib/in-memory-trekker.ts';
import { ItemQueries } from '@/ui/lib/item-queries.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';

const trekker = new InMemoryTrekker();

export abstract class StoryItems {
  static readonly now = dayjs('2026-10-24T12:00:00Z').valueOf();

  static first(predicate: (item: ItemSummary) => boolean): ItemSummary {
    const item = trekker
      .list(ItemQueries.empty(ItemQueries.recentSort), null, 2000)
      .items.find(predicate);
    if (!item) {
      throw new Error('no story item matches');
    }
    return item;
  }

  static task() {
    return StoryItems.first((item) => {
      return item.kind === 'task' && item.subtasks.total > 0;
    });
  }

  static blockedTask() {
    return StoryItems.first((item) => {
      return item.kind === 'task' && item.blockedBy > 0;
    });
  }

  static epic() {
    return StoryItems.first((item) => {
      return item.kind === 'epic' && (item.progress?.total ?? 0) > 0;
    });
  }

  static longTitle(): ItemSummary {
    return {
      ...StoryItems.task(),
      title:
        'A very long task title that keeps going to check how the card clamps text to two lines without breaking the layout',
      tags: ['performance', 'backend', 'search', 'ui'],
    };
  }
}
