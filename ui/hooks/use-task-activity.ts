import { useServices } from '@/ui/context/services/use-services.ts';
import { usePagedList } from '@/ui/hooks/use-paged-list.ts';

export const useTaskActivity = (taskId: string) => {
  const { history } = useServices();
  return usePagedList(history.get({ types: [], actions: [], entityId: taskId }));
};
