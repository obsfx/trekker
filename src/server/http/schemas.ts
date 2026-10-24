import plur from 'plur';
import * as v from 'valibot';
import { EPIC_STATUSES, LIST_ENTITY_TYPES, PRIORITIES, TASK_STATUSES } from '@/src/types';
import { HISTORY_ACTIONS, HISTORY_ENTITY_TYPES } from '@/src/services/history';
import { DATE_FIELDS, ITEM_SORT_FIELDS, SORT_DIRECTIONS } from '@/src/services/items';
import type { ItemSort, ItemSortField, SortDirection } from '@/src/services/items';
import { MAX_PAGE_LIMIT } from '@/src/server/constants';

interface SortFieldQuery {
  field: ItemSortField;
  direction?: SortDirection;
}

abstract class RequestSchemas {
  static readonly splitCsv = (value: string): string[] => {
    return value
      .split(',')
      .map((part) => {
        return part.trim();
      })
      .filter((part) => {
        return part.length > 0;
      });
  };

  static oneOf(name: string, options: readonly (string | number)[]): string {
    return `${name} must be one of: ${options.join(', ')}`;
  }

  static csvOf<const TOptions extends readonly string[]>(name: string, options: TOptions) {
    return v.optional(
      v.pipe(
        v.string(),
        v.transform(RequestSchemas.splitCsv),
        v.array(v.picklist(options, RequestSchemas.oneOf(name, options)))
      )
    );
  }

  static readonly withDefaultDirection = (sort: SortFieldQuery): ItemSort => {
    return { field: sort.field, direction: sort.direction ?? DEFAULT_DIRECTIONS[sort.field] };
  };

  static readonly splitSort = (value: string): SortInput => {
    const [field, direction] = value.split(':');
    return { field, direction };
  };

  static readonly joinTags = (tags: string[]): string | null => {
    if (tags.length === 0) {
      return null;
    }
    return tags.join(',');
  };

  static readonly hasSomeField = (input: Record<string, unknown>): boolean => {
    return Object.values(input).some((value) => {
      return value !== undefined;
    });
  };

  static readonly objectMessage = (issue: v.StrictObjectIssue): string => {
    if (issue.expected === 'never') {
      return 'unknown field';
    }
    if (issue.expected === 'Object') {
      return 'expected a JSON object';
    }
    return 'required field is missing';
  };

  static readonly numericString = (name: string) => {
    return v.pipe(
      v.string(),
      v.digits(`${name} must be a non-negative integer`),
      v.toNumber(),
      v.safeInteger()
    );
  };

  static readonly requiredText = (name: string) => {
    return v.pipe(
      v.string(),
      v.check((value) => {
        return value.trim().length > 0;
      }, `${name} must not be empty`)
    );
  };

  static readonly epochMs = (name: string) => {
    return v.optional(RequestSchemas.numericString(name));
  };
}

interface SortInput {
  field: string;
  direction?: string;
}

const DEFAULT_DIRECTIONS: Record<ItemSortField, SortDirection> = {
  created: 'desc',
  updated: 'desc',
  priority: 'asc',
  title: 'asc',
  rank: 'asc',
};

const NOTHING_TO_UPDATE = 'Provide at least one field to update';
const MOVE_PLACEMENTS = ['before', 'after'] as const;

const nonNegativeInteger = v.pipe(v.number(), v.safeInteger(), v.minValue(0));

const id = v.pipe(v.string(), v.trim(), v.nonEmpty('id must not be empty'));
const title = v.pipe(v.string(), v.trim(), v.nonEmpty('title must not be empty'));
const priority = v.picklist(PRIORITIES, RequestSchemas.oneOf('priority', PRIORITIES));
const taskStatus = v.picklist(TASK_STATUSES, RequestSchemas.oneOf('status', TASK_STATUSES));
const epicStatus = v.picklist(EPIC_STATUSES, RequestSchemas.oneOf('status', EPIC_STATUSES));
const tagList = v.pipe(
  v.array(
    v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty('tags must not be empty'),
      v.excludes(',', 'tags must not contain commas')
    )
  ),
  v.transform(RequestSchemas.joinTags)
);

const limit = v.optional(
  v.pipe(
    RequestSchemas.numericString('limit'),
    v.minValue(1),
    v.maxValue(MAX_PAGE_LIMIT, `limit must be at most ${MAX_PAGE_LIMIT}`)
  )
);
const cursor = v.optional(v.pipe(v.string(), v.nonEmpty('cursor must not be empty')));
const sort = v.optional(
  v.pipe(
    v.string(),
    v.transform(RequestSchemas.splitSort),
    v.object({
      field: v.picklist(ITEM_SORT_FIELDS, RequestSchemas.oneOf('sort field', ITEM_SORT_FIELDS)),
      direction: v.optional(
        v.picklist(SORT_DIRECTIONS, RequestSchemas.oneOf('sort direction', SORT_DIRECTIONS))
      ),
    }),
    v.transform(RequestSchemas.withDefaultDirection)
  )
);
const taskStatuses = RequestSchemas.csvOf('status', TASK_STATUSES);
const priorities = v.optional(
  v.pipe(
    v.string(),
    v.transform(RequestSchemas.splitCsv),
    v.array(
      v.pipe(
        v.string(),
        v.digits(RequestSchemas.oneOf('priority', PRIORITIES)),
        v.toNumber(),
        priority
      )
    )
  )
);

const itemIds = v.optional(
  v.pipe(
    v.string(),
    v.transform((value) => {
      return [...new Set(RequestSchemas.splitCsv(value))];
    }),
    v.maxLength(
      MAX_PAGE_LIMIT,
      `ids accepts at most ${MAX_PAGE_LIMIT} ${plur('id', MAX_PAGE_LIMIT)}`
    )
  )
);

export const itemsQuery = v.object({
  ids: itemIds,
  dateField: v.optional(v.picklist(DATE_FIELDS, RequestSchemas.oneOf('dateField', DATE_FIELDS))),
  from: RequestSchemas.epochMs('from'),
  to: RequestSchemas.epochMs('to'),
  type: RequestSchemas.csvOf('type', LIST_ENTITY_TYPES),
  status: taskStatuses,
  priority: priorities,
  epic: v.optional(id),
  parent: v.optional(id),
  sort,
  cursor,
  limit,
});

export const epicTasksQuery = v.object({ status: taskStatuses, sort, cursor, limit });

export const searchQuery = v.object({
  q: v.pipe(v.string('q is required'), v.trim(), v.nonEmpty('q must not be empty')),
  type: RequestSchemas.csvOf('type', LIST_ENTITY_TYPES),
  status: taskStatuses,
  cursor,
  limit,
});

export const pageQuery = v.object({ cursor, limit });

export const historyQuery = v.object({
  type: RequestSchemas.csvOf('type', HISTORY_ENTITY_TYPES),
  action: RequestSchemas.csvOf('action', HISTORY_ACTIONS),
  entity: v.optional(id),
  from: RequestSchemas.epochMs('from'),
  to: RequestSchemas.epochMs('to'),
  cursor,
  limit,
});

export const eventsQuery = v.object({ after: v.optional(RequestSchemas.numericString('after')) });

export const lastEventId = RequestSchemas.numericString('Last-Event-ID');

export const itemCursor = v.object({
  s: v.string(),
  v: v.union([v.string(), v.number()]),
  i: v.string(),
});
export const sequenceCursor = v.object({ r: nonNegativeInteger });
export const beforeCursor = v.object({ b: nonNegativeInteger });
export const offsetCursor = v.object({ o: nonNegativeInteger });

export const createTaskBody = v.strictObject(
  {
    title,
    description: v.optional(v.nullable(v.string())),
    priority: v.optional(priority),
    status: v.optional(taskStatus),
    epicId: v.optional(v.nullable(id)),
    parentTaskId: v.optional(v.nullable(id)),
    tags: v.optional(tagList),
  },
  RequestSchemas.objectMessage
);

export const updateTaskBody = v.pipe(
  v.strictObject(
    {
      title: v.optional(title),
      description: v.optional(v.nullable(v.string())),
      priority: v.optional(priority),
      status: v.optional(taskStatus),
      epicId: v.optional(v.nullable(id)),
      tags: v.optional(tagList),
    },
    RequestSchemas.objectMessage
  ),
  v.check(RequestSchemas.hasSomeField, NOTHING_TO_UPDATE)
);

export const createEpicBody = v.strictObject(
  {
    title,
    description: v.optional(v.nullable(v.string())),
    priority: v.optional(priority),
    status: v.optional(epicStatus),
  },
  RequestSchemas.objectMessage
);

export const updateEpicBody = v.pipe(
  v.strictObject(
    {
      title: v.optional(title),
      description: v.optional(v.nullable(v.string())),
      priority: v.optional(priority),
      status: v.optional(epicStatus),
    },
    RequestSchemas.objectMessage
  ),
  v.check(RequestSchemas.hasSomeField, NOTHING_TO_UPDATE)
);

export const createCommentBody = v.strictObject(
  {
    author: v.pipe(v.string(), v.trim(), v.nonEmpty('author must not be empty')),
    content: RequestSchemas.requiredText('content'),
  },
  RequestSchemas.objectMessage
);

export const updateCommentBody = v.strictObject(
  { content: RequestSchemas.requiredText('content') },
  RequestSchemas.objectMessage
);

export const moveBody = v.strictObject(
  {
    status: taskStatus,
    anchorId: v.nullable(id),
    placement: v.picklist(MOVE_PLACEMENTS, RequestSchemas.oneOf('placement', MOVE_PLACEMENTS)),
  },
  RequestSchemas.objectMessage
);

export const dependencyBody = v.strictObject({ dependsOnId: id }, RequestSchemas.objectMessage);

export const configBody = v.pipe(
  v.strictObject(
    {
      issue_prefix: v.optional(v.string()),
      epic_prefix: v.optional(v.string()),
      comment_prefix: v.optional(v.string()),
    },
    RequestSchemas.objectMessage
  ),
  v.check(RequestSchemas.hasSomeField, NOTHING_TO_UPDATE)
);
