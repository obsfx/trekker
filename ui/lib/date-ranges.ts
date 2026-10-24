import dayjs from 'dayjs';
import * as v from 'valibot';

import type { DateField, DateRange } from '@/ui/lib/item-queries.ts';

const DATE_PRESETS = ['any', 'today', 'week', 'month', 'year', 'custom'] as const;

export type DatePreset = (typeof DATE_PRESETS)[number];

export interface DateFilter {
  field: DateField;
  preset: DatePreset;
  from: number | null;
  to: number | null;
}

export abstract class DateRanges {
  static readonly presets: readonly DatePreset[] = ['any', 'today', 'week', 'month', 'year'];

  static readonly filterSchema = v.object({
    field: v.picklist(['created', 'updated']),
    preset: v.picklist(DATE_PRESETS),
    from: v.nullable(v.number()),
    to: v.nullable(v.number()),
  });

  private static readonly presetLabels: Record<DatePreset, string> = {
    any: 'Any time',
    today: 'Today',
    week: 'Last 7 days',
    month: 'Last 30 days',
    year: 'Last 12 months',
    custom: 'Custom range',
  };

  private static readonly fieldLabels: Record<DateField, string> = {
    created: 'Created',
    updated: 'Updated',
  };

  static presetLabel(preset: DatePreset) {
    return DateRanges.presetLabels[preset];
  }

  static fieldLabel(field: DateField) {
    return DateRanges.fieldLabels[field];
  }

  static fromPreset(
    field: DateField,
    preset: DatePreset,
    now = dayjs().valueOf()
  ): DateRange | null {
    const today = dayjs(now).startOf('day');
    if (preset === 'today') {
      return { field, from: today.valueOf(), to: null };
    }
    if (preset === 'week') {
      return { field, from: today.subtract(6, 'day').valueOf(), to: null };
    }
    if (preset === 'month') {
      return { field, from: today.subtract(29, 'day').valueOf(), to: null };
    }
    if (preset === 'year') {
      return { field, from: today.subtract(1, 'year').valueOf(), to: null };
    }
    return null;
  }

  static fromDays(field: DateField, fromDay: string, toDay: string): DateRange | null {
    const from = fromDay === '' ? null : dayjs(fromDay).startOf('day').valueOf();
    const to = toDay === '' ? null : dayjs(toDay).add(1, 'day').startOf('day').valueOf();
    if (from === null && to === null) {
      return null;
    }
    return { field, from, to };
  }

  static dayValue(at: number | null) {
    if (at === null) {
      return '';
    }
    return dayjs(at).format('YYYY-MM-DD');
  }

  static lastDayValue(to: number | null) {
    if (to === null) {
      return '';
    }
    return dayjs(to).subtract(1, 'day').format('YYYY-MM-DD');
  }

  static resolve(filter: DateFilter | null, now = dayjs().valueOf()): DateRange | null {
    if (!filter) {
      return null;
    }
    if (filter.preset !== 'custom') {
      return DateRanges.fromPreset(filter.field, filter.preset, now);
    }
    if (filter.from === null && filter.to === null) {
      return null;
    }
    return { field: filter.field, from: filter.from, to: filter.to };
  }

  static describe(filter: DateFilter | null) {
    if (!filter || filter.preset === 'any') {
      return null;
    }
    if (filter.preset !== 'custom') {
      return DateRanges.presetLabel(filter.preset);
    }
    const from = filter.from === null ? null : dayjs(filter.from).format('MMM D');
    const last = filter.to === null ? null : dayjs(filter.to).subtract(1, 'day').format('MMM D');
    if (from && last) {
      return `${from} to ${last}`;
    }
    if (from) {
      return `Since ${from}`;
    }
    if (last) {
      return `Until ${last}`;
    }
    return null;
  }

  static custom(field: DateField, fromDay: string, toDay: string): DateFilter | null {
    const range = DateRanges.fromDays(field, fromDay, toDay);
    if (!range) {
      return null;
    }
    return { field, preset: 'custom', from: range.from, to: range.to };
  }
}
