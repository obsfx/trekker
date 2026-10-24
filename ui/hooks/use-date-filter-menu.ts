import { useState } from 'react';

import { type DateFilter, type DatePreset, DateRanges } from '@/ui/lib/date-ranges.ts';
import type { DateField } from '@/ui/lib/item-queries.ts';

export const useDateFilterMenu = (
  filter: DateFilter | null,
  fields: readonly DateField[],
  onChange: (filter: DateFilter | null) => void
) => {
  const [field, setField] = useState<DateField>(filter?.field ?? fields[0] ?? 'updated');
  const active = filter !== null && filter.preset !== 'any';
  return {
    field,
    active,
    summary: DateRanges.describe(filter),
    preset: filter?.preset ?? 'any',
    fromDay: filter?.preset === 'custom' ? DateRanges.dayValue(filter.from) : '',
    toDay: filter?.preset === 'custom' ? DateRanges.lastDayValue(filter.to) : '',
    chooseField: (next: DateField) => {
      setField(next);
      if (filter) {
        onChange({ ...filter, field: next });
      }
    },
    choosePreset: (preset: DatePreset) => {
      if (preset === 'any') {
        onChange(null);
        return;
      }
      onChange({ field, preset, from: null, to: null });
    },
    chooseDays: (fromDay: string, toDay: string) => {
      onChange(DateRanges.custom(field, fromDay, toDay));
    },
    clear: () => {
      onChange(null);
    },
  };
};
