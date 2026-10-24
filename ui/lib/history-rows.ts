import type { HistoryEvent } from '@/ui/lib/history-shapes.ts';
import { RelativeTime } from '@/ui/lib/relative-time.ts';

interface DayRow {
  kind: 'day';
  key: string;
  label: string;
}

interface EventRow {
  kind: 'event';
  key: string;
  event: HistoryEvent;
}

export type HistoryRow = DayRow | EventRow;

export abstract class HistoryRows {
  static group(events: readonly HistoryEvent[], now: number): HistoryRow[] {
    const rows: HistoryRow[] = [];
    let currentDay: string | null = null;
    for (const event of events) {
      const day = RelativeTime.day(event.createdAt, now);
      if (day !== currentDay) {
        rows.push({ kind: 'day', key: `day-${String(event.id)}`, label: day });
        currentDay = day;
      }
      rows.push({ kind: 'event', key: `event-${String(event.id)}`, event });
    }
    return rows;
  }
}
