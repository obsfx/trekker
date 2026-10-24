import * as v from 'valibot';

const PRIORITY_VALUES = [0, 1, 2, 3, 4, 5] as const;

export type Priority = (typeof PRIORITY_VALUES)[number];

export abstract class Priorities {
  static readonly all: readonly Priority[] = PRIORITY_VALUES;
  static readonly fallback: Priority = 2;
  static readonly schema = v.picklist(PRIORITY_VALUES);

  private static readonly labels: Record<Priority, string> = {
    0: 'Critical',
    1: 'High',
    2: 'Medium',
    3: 'Low',
    4: 'Backlog',
    5: 'Someday',
  };

  static label(priority: Priority) {
    return Priorities.labels[priority];
  }

  static code(priority: Priority) {
    return `P${priority}`;
  }

  static describe(priority: Priority) {
    return `${Priorities.code(priority)} ${Priorities.label(priority)}`;
  }
}
