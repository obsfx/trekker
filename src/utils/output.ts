import plur from 'plur';
import dayjs from 'dayjs';
import { encode } from '@toon-format/toon';
import type { Epic, Task, Comment, PaginatedResponse, ProjectConfigEntry } from '@/src/types';
import { STATUS_PAD_WIDTH, JSON_INDENT } from '@/src/utils/constants';
import type { DependencyLink } from '@/src/types';

export abstract class Output {
  private static toonMode = false;

  static setToonMode(enabled: boolean): void {
    Output.toonMode = enabled;
  }

  static isToonMode(): boolean {
    return Output.toonMode;
  }

  static print(data: unknown): void {
    if (Output.toonMode) {
      console.log(encode(data));
    } else if (typeof data === 'string') {
      console.log(data);
    } else {
      console.log(JSON.stringify(data, null, JSON_INDENT));
    }
  }

  static success(message: string, data?: unknown): void {
    if (Output.toonMode) {
      console.log(encode({ success: true, message, data }));
    } else {
      console.log(message);
      if (data) {
        Output.print(data);
      }
    }
  }

  static error(message: string, details?: unknown): void {
    if (Output.toonMode) {
      console.error(encode({ success: false, error: message, details }));
    } else {
      console.error(`Error: ${message}`);
      if (details) {
        console.error(details);
      }
    }
  }

  /**
   * Handles command errors with consistent formatting and exits with code 1.
   * Use in catch blocks to replace duplicate error handling patterns.
   */
  static handleCommandError(err: unknown): never {
    if (err instanceof Error) {
      Output.error(err.message);
    } else {
      Output.error(String(err));
    }
    process.exit(1);
  }

  /**
   * Handles entity not found with an error message and exits with code 1.
   */
  static handleNotFound(entityType: string, id: string): never {
    Output.error(`${entityType} not found: ${id}`);
    process.exit(1);
  }

  /**
   * Outputs result in the appropriate format (toon or standard).
   * Reduces duplicate if/else branching in commands.
   */
  static outputResult<T>(data: T, formatter: (data: T) => string, successMessage?: string): void {
    if (Output.isToonMode()) {
      Output.print(data);
      return;
    }
    if (successMessage) {
      Output.success(successMessage);
    }
    console.log(formatter(data));
  }

  static info(message: string): void {
    if (!Output.toonMode) {
      console.log(message);
    }
  }

  static readonly formatTask = (task: Task): string => {
    const lines = [
      `ID:          ${task.id}`,
      `Title:       ${task.title}`,
      `Status:      ${task.status}`,
      `Priority:    ${task.priority}`,
    ];

    if (task.description) {
      lines.push(`Description: ${task.description}`);
    }
    if (task.epicId) {
      lines.push(`Epic:        ${task.epicId}`);
    }
    if (task.parentTaskId) {
      lines.push(`Parent:      ${task.parentTaskId}`);
    }
    if (task.tags) {
      lines.push(`Tags:        ${task.tags}`);
    }
    lines.push(`Created:     ${dayjs(task.createdAt).toISOString()}`);
    lines.push(`Updated:     ${dayjs(task.updatedAt).toISOString()}`);

    return lines.join('\n');
  };

  static readonly formatEpic = (epic: Epic): string => {
    const lines = [
      `ID:          ${epic.id}`,
      `Title:       ${epic.title}`,
      `Status:      ${epic.status}`,
      `Priority:    ${epic.priority}`,
    ];

    if (epic.description) {
      lines.push(`Description: ${epic.description}`);
    }
    lines.push(`Created:     ${dayjs(epic.createdAt).toISOString()}`);
    lines.push(`Updated:     ${dayjs(epic.updatedAt).toISOString()}`);

    return lines.join('\n');
  };

  static readonly formatComment = (comment: Comment): string => {
    const lines = [
      `ID:      ${comment.id}`,
      `Author:  ${comment.author}`,
      `Content: ${comment.content}`,
      `Created: ${dayjs(comment.createdAt).toISOString()}`,
    ];

    return lines.join('\n');
  };

  static formatDependencyList(
    dependencies: DependencyLink[],
    direction: 'depends_on' | 'blocks'
  ): string {
    if (dependencies.length === 0) {
      if (direction === 'depends_on') {
        return 'No dependencies.';
      }
      return 'Does not block any tasks.';
    }

    if (direction === 'depends_on') {
      return dependencies
        .map((d) => {
          return `  ${d.dependsOnId}`;
        })
        .join('\n');
    }
    return dependencies
      .map((d) => {
        return `  ${d.taskId}`;
      })
      .join('\n');
  }

  static joinWithPageLine(lines: string[], total: number, page: number, limit: number): string {
    const pageLine = Output.pageLine(total, page, limit);
    if (pageLine !== null) {
      lines.push(pageLine);
    }
    return lines.join('\n');
  }

  static pageLine(total: number, page: number, limit: number): string | null {
    const totalPages = Math.ceil(total / limit);
    if (totalPages > 1) {
      return `Page ${page} of ${totalPages}`;
    }
    return null;
  }

  private static formatPaginationFooter(total: number, page: number, limit: number): string {
    const line = Output.pageLine(total, page, limit);
    if (line === null) {
      return '';
    }
    return `\n${line}`;
  }

  static readonly formatPaginatedTaskList = (result: PaginatedResponse<Task>): string => {
    const lines: string[] = [];
    lines.push(
      `${result.total} ${plur('task', result.total)} (page ${result.page}, ${result.limit} per page)\n`
    );

    if (result.items.length === 0) {
      lines.push('No tasks found.');
      return lines.join('\n');
    }

    for (const task of result.items) {
      let tags = '';
      if (task.tags) {
        tags = ` [${task.tags}]`;
      }
      let parent = '';
      if (task.parentTaskId) {
        parent = ` (subtask of ${task.parentTaskId})`;
      }
      lines.push(
        `${task.id} | ${task.status.padEnd(STATUS_PAD_WIDTH)} | P${task.priority} | ${task.title}${tags}${parent}`
      );
    }

    lines.push(Output.formatPaginationFooter(result.total, result.page, result.limit));
    return lines.join('\n');
  };

  static readonly formatPaginatedEpicList = (result: PaginatedResponse<Epic>): string => {
    const lines: string[] = [];
    lines.push(
      `${result.total} ${plur('epic', result.total)} (page ${result.page}, ${result.limit} per page)\n`
    );

    if (result.items.length === 0) {
      lines.push('No epics found.');
      return lines.join('\n');
    }

    for (const epic of result.items) {
      lines.push(
        `${epic.id} | ${epic.status.padEnd(STATUS_PAD_WIDTH)} | P${epic.priority} | ${epic.title}`
      );
    }

    lines.push(Output.formatPaginationFooter(result.total, result.page, result.limit));
    return lines.join('\n');
  };

  static readonly formatPaginatedCommentList = (result: PaginatedResponse<Comment>): string => {
    const lines: string[] = [];
    lines.push(
      `${result.total} ${plur('comment', result.total)} (page ${result.page}, ${result.limit} per page)\n`
    );

    if (result.items.length === 0) {
      lines.push('No comments found.');
      return lines.join('\n');
    }

    for (const c of result.items) {
      lines.push(`[${c.id}] ${c.author}: ${c.content}`);
    }

    lines.push(Output.formatPaginationFooter(result.total, result.page, result.limit));
    return lines.join('\n');
  };

  static readonly formatProjectConfigList = (entries: ProjectConfigEntry[]): string => {
    if (entries.length === 0) {
      return 'No config values found.';
    }

    return entries
      .map((entry) => {
        return `${entry.key}=${entry.value}`;
      })
      .join('\n');
  };
}
