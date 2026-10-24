import { useServices } from '@/ui/context/services/use-services.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import { ItemStatuses } from '@/ui/lib/item-statuses.ts';

export const useDependencyActions = (task: TaskDetail) => {
  const { taskActions } = useServices();
  const linkedIds = [
    task.id,
    ...task.dependsOn.map((ref) => {
      return ref.id;
    }),
    ...task.blocks.map((ref) => {
      return ref.id;
    }),
  ];
  const openBlockers = task.dependsOn.filter((ref) => {
    return !ItemStatuses.isDone(ref.status);
  }).length;
  return {
    linkedIds,
    dependsOnCount: openBlockers > 0 ? `${String(openBlockers)} open` : undefined,
    addDependsOn: (id: string) => {
      void taskActions.addDependency(task.id, id);
    },
    addBlocks: (id: string) => {
      void taskActions.addDependency(id, task.id);
    },
    removeDependsOn: (id: string) => {
      void taskActions.removeDependency(task.id, id);
    },
    removeBlocks: (id: string) => {
      void taskActions.removeDependency(id, task.id);
    },
  };
};
