import plur from 'plur';

import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';

export abstract class DeleteLabels {
  static task(task: TaskDetail) {
    const parts = ['comments', 'links'];
    if (task.subtaskList.length > 0) {
      parts.unshift(
        `${String(task.subtaskList.length)} ${plur('subtask', task.subtaskList.length)}`
      );
    }
    return `Deletes ${task.id} with its ${parts.join(', ')}. This cannot be undone.`;
  }
}
