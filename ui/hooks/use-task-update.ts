import { useServices } from '@/ui/context/services/use-services.ts';
import type { TaskPatch } from '@/ui/lib/gateways.ts';

export const useTaskUpdate = (taskId: string) => {
  const { taskActions } = useServices();
  return (patch: TaskPatch) => {
    void taskActions.update(taskId, patch);
  };
};
