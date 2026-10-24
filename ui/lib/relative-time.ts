import dayjs from 'dayjs';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

interface TimeStep {
  size: number;
  suffix: string;
}

export abstract class RelativeTime {
  private static readonly steps: readonly TimeStep[] = [
    { size: YEAR_MS, suffix: 'y' },
    { size: MONTH_MS, suffix: 'mo' },
    { size: WEEK_MS, suffix: 'w' },
    { size: DAY_MS, suffix: 'd' },
    { size: HOUR_MS, suffix: 'h' },
    { size: MINUTE_MS, suffix: 'm' },
  ];

  static short(timestamp: number, now: number = dayjs().valueOf()) {
    const elapsed = Math.max(now - timestamp, 0);
    for (const { size, suffix } of RelativeTime.steps) {
      if (elapsed >= size) {
        return `${String(Math.floor(elapsed / size))}${suffix}`;
      }
    }
    return 'now';
  }

  static ago(timestamp: number, now: number = dayjs().valueOf()) {
    const label = RelativeTime.short(timestamp, now);
    if (label === 'now') {
      return 'just now';
    }
    return `${label} ago`;
  }

  static full(timestamp: number) {
    return dayjs(timestamp).format('MMM D, YYYY HH:mm');
  }

  static time(timestamp: number) {
    return dayjs(timestamp).format('HH:mm');
  }

  static day(timestamp: number, now: number = dayjs().valueOf()) {
    const date = dayjs(timestamp);
    const today = dayjs(now);
    if (date.isSame(today, 'day')) {
      return 'Today';
    }
    if (date.isSame(today.subtract(1, 'day'), 'day')) {
      return 'Yesterday';
    }
    return date.format('ddd, MMM D');
  }
}
