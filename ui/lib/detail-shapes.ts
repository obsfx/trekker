import * as v from 'valibot';

import { type ItemRef, ItemShapes, type ItemSummary } from '@/ui/lib/item-shapes.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import { Priorities, type Priority } from '@/ui/lib/priorities.ts';
import { ValueSchemas } from '@/ui/lib/value-schemas.ts';

export interface RankedRef extends ItemRef {
  priority: Priority;
}

export interface TaskDetail extends ItemSummary {
  description: string | null;
  subtaskList: RankedRef[];
  dependsOn: ItemRef[];
  blocks: ItemRef[];
}

export interface EpicDetail extends ItemSummary {
  description: string | null;
  statusCounts: Record<ItemStatus, number>;
}

export interface TaskComment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export abstract class DetailShapes {
  static readonly rankedRef = v.object({
    ...ItemShapes.ref.entries,
    priority: v.fallback(Priorities.schema, Priorities.fallback),
  });

  static readonly task = v.object({
    ...ItemShapes.summaryEntries,
    description: ValueSchemas.nullableString,
    subtaskList: v.fallback(v.array(DetailShapes.rankedRef), []),
    dependsOn: v.fallback(v.array(ItemShapes.ref), []),
    blocks: v.fallback(v.array(ItemShapes.ref), []),
  });

  static readonly statusCounts = v.pipe(
    v.record(v.string(), ValueSchemas.count),
    v.transform((counts): Record<ItemStatus, number> => {
      return {
        todo: counts.todo ?? 0,
        in_progress: counts.in_progress ?? 0,
        completed: counts.completed ?? 0,
        wont_fix: counts.wont_fix ?? 0,
        archived: counts.archived ?? 0,
      };
    })
  );

  static readonly epic = v.object({
    ...ItemShapes.summaryEntries,
    description: ValueSchemas.nullableString,
    statusCounts: DetailShapes.statusCounts,
  });

  static readonly comment = v.object({
    id: v.string(),
    taskId: v.string(),
    author: v.string(),
    content: v.string(),
    createdAt: ValueSchemas.timestamp,
    updatedAt: ValueSchemas.timestamp,
  });
}
