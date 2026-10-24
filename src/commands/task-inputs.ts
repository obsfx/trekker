import type { SubtaskUpdateOptions } from '@/src/types/options';
import { Validator } from '@/src/utils/validator';

export abstract class TaskInputs {
  static update(options: SubtaskUpdateOptions): Record<string, unknown> {
    const input: Record<string, unknown> = {};
    if (options.title !== undefined) {
      input.title = options.title;
    }
    if (options.description !== undefined) {
      input.description = options.description;
    }
    if (options.priority !== undefined) {
      input.priority = Validator.parsePriority(options.priority);
    }
    if (options.status !== undefined) {
      input.status = Validator.parseTaskStatus(options.status);
    }
    return input;
  }
}
