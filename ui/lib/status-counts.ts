import plur from 'plur';

import { type ItemStatus, ItemStatuses } from '@/ui/lib/item-statuses.ts';

export interface StatusSegment {
  status: ItemStatus;
  percent: number;
}

export abstract class StatusCounts {
  static total(counts: Record<ItemStatus, number>) {
    return ItemStatuses.all.reduce((sum, status) => {
      return sum + counts[status];
    }, 0);
  }

  static segments(counts: Record<ItemStatus, number>): StatusSegment[] {
    const total = StatusCounts.total(counts);
    const segments: StatusSegment[] = [];
    if (total === 0) {
      return segments;
    }
    for (const status of ItemStatuses.all) {
      if (counts[status] > 0) {
        segments.push({ status, percent: (counts[status] / total) * 100 });
      }
    }
    return segments;
  }

  static done(counts: Record<ItemStatus, number>) {
    return ItemStatuses.all.reduce((sum, status) => {
      if (ItemStatuses.isDone(status)) {
        return sum + counts[status];
      }
      return sum;
    }, 0);
  }

  static summary(counts: Record<ItemStatus, number>) {
    const total = StatusCounts.total(counts);
    if (total === 0) {
      return 'No tasks yet';
    }
    return `${String(StatusCounts.done(counts))} of ${String(total)} ${plur('task', total)} done`;
  }
}
