import { useTaskUpdate } from '@/ui/hooks/use-task-update.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import { KindStatuses } from '@/ui/lib/kind-statuses.ts';
import type { Priority } from '@/ui/lib/priorities.ts';
import { RelativeTime } from '@/ui/lib/relative-time.ts';

export const useTaskProperties = (task: TaskDetail) => {
  const update = useTaskUpdate(task.id);
  return {
    setTitle: (title: string) => {
      update({ title });
    },
    setDescription: (description: string | null) => {
      update({ description });
    },
    statuses: KindStatuses.of(task.kind),
    canChangeEpic: task.kind === 'task',
    created: `Created ${RelativeTime.ago(task.createdAt)}`,
    createdTitle: RelativeTime.full(task.createdAt),
    updated: `updated ${RelativeTime.ago(task.updatedAt)}`,
    updatedTitle: RelativeTime.full(task.updatedAt),
    setStatus: (status: ItemStatus) => {
      update({ status });
    },
    setPriority: (priority: Priority) => {
      update({ priority });
    },
    setEpic: (epicId: string | null) => {
      update({ epicId });
    },
    setTags: (tags: string[]) => {
      update({ tags });
    },
  };
};

export type TaskPropertyControls = ReturnType<typeof useTaskProperties>;
