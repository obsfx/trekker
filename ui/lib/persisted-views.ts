import * as v from 'valibot';

import { DateRanges } from '@/ui/lib/date-ranges.ts';
import { HistoryShapes } from '@/ui/lib/history-shapes.ts';
import { ItemKinds } from '@/ui/lib/item-kinds.ts';
import { ItemQueries } from '@/ui/lib/item-queries.ts';
import { ItemStatuses } from '@/ui/lib/item-statuses.ts';
import { Priorities } from '@/ui/lib/priorities.ts';
import { ThemePreferences } from '@/ui/lib/theme-preferences.ts';

export abstract class PersistedViews {
  static readonly preferences = v.object({
    theme: v.fallback(ThemePreferences.schema, 'system'),
    author: v.fallback(v.pipe(v.string(), v.trim(), v.minLength(1)), 'user'),
    notifications: v.fallback(v.boolean(), false),
  });

  static readonly boardView = v.object({
    kind: v.fallback(v.picklist(['all', 'epic', 'task']), 'all'),
    epicId: v.fallback(v.nullable(v.string()), null),
    sort: v.fallback(ItemQueries.sortSchema, ItemQueries.manualSort),
  });

  static readonly listView = v.object({
    types: v.fallback(v.array(ItemKinds.schema), []),
    statuses: v.fallback(v.array(ItemStatuses.schema), []),
    priorities: v.fallback(v.array(Priorities.schema), []),
    epicId: v.fallback(v.nullable(v.string()), null),
    dateFilter: v.fallback(v.nullable(DateRanges.filterSchema), null),
    sort: v.fallback(ItemQueries.sortSchema, ItemQueries.recentSort),
  });

  static readonly historyView = v.object({
    types: v.fallback(v.array(v.picklist(HistoryShapes.entities)), []),
    actions: v.fallback(v.array(v.picklist(HistoryShapes.actions)), []),
    dateFilter: v.fallback(v.nullable(DateRanges.filterSchema), null),
  });
}
