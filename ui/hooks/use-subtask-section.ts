import { useSubtaskComposer } from '@/ui/hooks/use-subtask-composer.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import { LinkedRows } from '@/ui/lib/linked-rows.ts';
import { Tallies } from '@/ui/lib/tallies.ts';

export const useSubtaskSection = (task: TaskDetail) => {
  const composer = useSubtaskComposer(task);
  return {
    composer,
    rows: LinkedRows.of(task.subtaskList, 'subtask'),
    count: Tallies.fraction(task.subtasks),
  };
};
