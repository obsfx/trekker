import { useServices } from '@/ui/context/services/use-services.ts';
import { usePagedList } from '@/ui/hooks/use-paged-list.ts';

export const useCommentThread = (taskId: string) => {
  const { comments } = useServices();
  return usePagedList(comments.get(taskId));
};
