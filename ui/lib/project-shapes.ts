import * as v from 'valibot';

import { ValueSchemas } from '@/ui/lib/value-schemas.ts';

export interface ProjectCounts {
  epics: number;
  tasks: number;
  subtasks: number;
}

export interface ProjectInfo {
  name: string;
  root: string;
  version: string;
  config: Record<string, string>;
  counts: ProjectCounts;
}

export abstract class ProjectShapes {
  static readonly project = v.object({
    name: v.string(),
    root: v.string(),
    version: v.string(),
    config: v.record(v.string(), v.string()),
    counts: v.object({
      epics: ValueSchemas.count,
      tasks: ValueSchemas.count,
      subtasks: ValueSchemas.count,
    }),
  });
}
