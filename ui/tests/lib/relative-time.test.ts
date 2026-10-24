import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { RelativeTime } from '@/ui/lib/relative-time.ts';

const NOW = dayjs('2026-10-24T12:00:00Z').valueOf();
const MINUTE = 60_000;

describe('RelativeTime', () => {
  it('formats short elapsed labels', () => {
    expect(RelativeTime.short(NOW - 20_000, NOW)).toBe('now');
    expect(RelativeTime.short(NOW - 5 * MINUTE, NOW)).toBe('5m');
    expect(RelativeTime.short(NOW - 3 * 60 * MINUTE, NOW)).toBe('3h');
    expect(RelativeTime.short(NOW - 9 * 24 * 60 * MINUTE, NOW)).toBe('1w');
  });

  it('writes ago labels without saying now ago', () => {
    expect(RelativeTime.ago(NOW - 20_000, NOW)).toBe('just now');
    expect(RelativeTime.ago(NOW - 5 * MINUTE, NOW)).toBe('5m ago');
  });

  it('names today and yesterday', () => {
    expect(RelativeTime.day(NOW - MINUTE, NOW)).toBe('Today');
    expect(RelativeTime.day(NOW - 24 * 60 * MINUTE, NOW)).toBe('Yesterday');
  });
});
