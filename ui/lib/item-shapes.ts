import * as v from 'valibot';

import { type ItemKind, ItemKinds } from '@/ui/lib/item-kinds.ts';
import { type ItemStatus, ItemStatuses } from '@/ui/lib/item-statuses.ts';
import { Priorities, type Priority } from '@/ui/lib/priorities.ts';
import { ValueSchemas } from '@/ui/lib/value-schemas.ts';

export interface ItemRef {
  id: string;
  title: string;
  status: ItemStatus;
}

export interface Tally {
  total: number;
  done: number;
}

export interface ItemSummary {
  kind: ItemKind;
  id: string;
  title: string;
  status: ItemStatus;
  priority: Priority;
  rank: string | null;
  tags: string[];
  epic: ItemRef | null;
  parent: ItemRef | null;
  subtasks: Tally;
  blockedBy: number;
  progress: Tally | null;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

export abstract class ItemShapes {
  static readonly ref = v.object({
    id: v.string(),
    title: v.string(),
    status: ItemStatuses.schema,
  });

  static readonly tally = v.object({ total: ValueSchemas.count, done: ValueSchemas.count });

  static readonly summaryEntries = {
    kind: ItemKinds.schema,
    id: v.string(),
    title: v.string(),
    status: ItemStatuses.schema,
    priority: v.fallback(Priorities.schema, Priorities.fallback),
    rank: v.fallback(v.nullable(v.string()), null),
    tags: v.fallback(v.array(v.string()), []),
    epic: v.nullable(ItemShapes.ref),
    parent: v.fallback(v.nullable(ItemShapes.ref), null),
    subtasks: ItemShapes.tally,
    blockedBy: ValueSchemas.count,
    progress: v.nullable(ItemShapes.tally),
    commentCount: ValueSchemas.count,
    createdAt: ValueSchemas.timestamp,
    updatedAt: ValueSchemas.timestamp,
  };

  static readonly summary = v.object(ItemShapes.summaryEntries);

  static page<TSchema extends v.GenericSchema>(item: TSchema) {
    return v.object({
      items: v.array(item),
      nextCursor: v.nullable(v.string()),
      total: ValueSchemas.count,
    });
  }
}
