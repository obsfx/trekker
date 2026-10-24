import * as v from 'valibot';

import type { HistoryEvent } from '@/ui/lib/history-shapes.ts';
import type { ItemKind } from '@/ui/lib/item-kinds.ts';
import { ItemStatuses } from '@/ui/lib/item-statuses.ts';
import { Priorities } from '@/ui/lib/priorities.ts';
import { RelativeTime } from '@/ui/lib/relative-time.ts';

export type HistoryGlyph = 'create' | 'update' | 'delete' | 'comment' | 'dependency';

export interface ChangeLabel {
  field: string;
  from: string | null;
  to: string | null;
}

export interface HistoryTarget {
  id: string;
  kind: ItemKind;
}

export interface HistoryDescription {
  glyph: HistoryGlyph;
  verb: string;
  label: string;
  target: HistoryTarget | null;
  title: string | null;
  changes: ChangeLabel[];
  snippet: string | null;
  time: string;
  fullTime: string;
}

export abstract class HistoryLabels {
  private static readonly maxValueLength = 60;
  private static readonly maxSnippetLength = 120;

  private static readonly fieldLabels: Record<string, string> = {
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    epicId: 'epic',
    epic_id: 'epic',
    parentTaskId: 'parent',
    parent_task_id: 'parent',
    tags: 'tags',
    content: 'comment',
  };

  private static readonly hiddenValues = new Set(['description', 'content']);

  private static readonly actionVerbs = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
  } as const;

  static describe(event: HistoryEvent): HistoryDescription {
    return {
      glyph: HistoryLabels.glyph(event),
      verb: HistoryLabels.verb(event),
      label: HistoryLabels.label(event),
      target: HistoryLabels.target(event),
      title: event.title,
      changes: HistoryLabels.changes(event),
      snippet: HistoryLabels.snippet(event),
      time: RelativeTime.time(event.createdAt),
      fullTime: RelativeTime.full(event.createdAt),
    };
  }

  static value(field: string, value: unknown): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (field === 'status' && v.is(ItemStatuses.schema, value)) {
      return ItemStatuses.label(value);
    }
    if (field === 'priority' && v.is(Priorities.schema, value)) {
      return Priorities.code(value);
    }
    if (Array.isArray(value)) {
      return HistoryLabels.truncate(value.map(String).join(', '), HistoryLabels.maxValueLength);
    }
    if (typeof value === 'string') {
      return HistoryLabels.truncate(value, HistoryLabels.maxValueLength);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return HistoryLabels.truncate(JSON.stringify(value), HistoryLabels.maxValueLength);
  }

  private static truncate(text: string, length: number) {
    const flat = text.replaceAll(/\s+/g, ' ').trim();
    if (flat.length <= length) {
      return flat;
    }
    return `${flat.slice(0, length - 3)}...`;
  }

  private static glyph(event: HistoryEvent): HistoryGlyph {
    if (event.entityType === 'comment') {
      return 'comment';
    }
    if (event.entityType === 'dependency') {
      return 'dependency';
    }
    return event.action;
  }

  private static verb(event: HistoryEvent) {
    if (event.entityType === 'comment') {
      if (event.action === 'create') {
        return 'commented on';
      }
      if (event.action === 'update') {
        return 'edited a comment on';
      }
      return 'deleted a comment on';
    }
    if (event.entityType === 'dependency') {
      if (event.action === 'delete') {
        return 'unlinked';
      }
      return 'linked';
    }
    return `${HistoryLabels.actionVerbs[event.action]} ${event.entityType}`;
  }

  private static label(event: HistoryEvent) {
    if (event.entityType === 'comment' || event.entityType === 'dependency') {
      return event.taskId ?? event.entityId;
    }
    return event.entityId;
  }

  private static target(event: HistoryEvent): HistoryTarget | null {
    if (event.entityType === 'comment' || event.entityType === 'dependency') {
      if (event.taskId) {
        return { id: event.taskId, kind: 'task' };
      }
      return null;
    }
    if (event.action === 'delete') {
      return null;
    }
    return { id: event.entityId, kind: event.entityType };
  }

  private static changes(event: HistoryEvent): ChangeLabel[] {
    if (event.entityType === 'dependency') {
      const dependsOn = event.snapshot?.dependsOnId;
      if (typeof dependsOn === 'string') {
        return [{ field: 'depends on', from: null, to: dependsOn }];
      }
      return [];
    }
    if (event.entityType === 'comment' || !event.changes) {
      return [];
    }
    return Object.entries(event.changes).map(([key, change]) => {
      const field = HistoryLabels.fieldLabels[key] ?? key;
      if (HistoryLabels.hiddenValues.has(key)) {
        return { field, from: null, to: null };
      }
      return {
        field,
        from: HistoryLabels.value(key, change.from),
        to: HistoryLabels.value(key, change.to),
      };
    });
  }

  private static snippet(event: HistoryEvent) {
    if (event.entityType !== 'comment') {
      return null;
    }
    const content = event.changes?.content?.to ?? event.snapshot?.content;
    if (typeof content !== 'string') {
      return null;
    }
    return HistoryLabels.truncate(content, HistoryLabels.maxSnippetLength);
  }
}
