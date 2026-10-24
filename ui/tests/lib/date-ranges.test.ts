import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { DateRanges } from '@/ui/lib/date-ranges.ts';

const NOW = dayjs('2026-10-24T15:30').valueOf();
const TODAY = dayjs('2026-10-24T00:00').valueOf();

describe('DateRanges', () => {
  it('resolves presets from the start of today', () => {
    expect(
      DateRanges.resolve({ field: 'updated', preset: 'today', from: null, to: null }, NOW)
    ).toEqual({
      field: 'updated',
      from: TODAY,
      to: null,
    });
    expect(
      DateRanges.resolve({ field: 'created', preset: 'week', from: null, to: null }, NOW)?.from
    ).toBe(dayjs('2026-10-18T00:00').valueOf());
    expect(DateRanges.resolve(null, NOW)).toBeNull();
  });

  it('turns a custom day range into an exclusive end', () => {
    const filter = DateRanges.custom('created', '2026-10-01', '2026-10-14');
    expect(filter).toEqual({
      field: 'created',
      preset: 'custom',
      from: dayjs('2026-10-01T00:00').valueOf(),
      to: dayjs('2026-10-15T00:00').valueOf(),
    });
    expect(DateRanges.lastDayValue(filter?.to ?? null)).toBe('2026-10-14');
    expect(DateRanges.describe(filter)).toBe('Oct 1 to Oct 14');
    expect(DateRanges.custom('created', '', '')).toBeNull();
  });
});
