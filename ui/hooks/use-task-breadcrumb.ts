import { useCopyValue } from '@/ui/hooks/use-copy-value.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';

export const useTaskBreadcrumb = (task: TaskDetail) => {
  const { copied, copy } = useCopyValue(task.id);
  let epicHref: string | null = null;
  if (task.epic) {
    epicHref = AppRoutes.item({ kind: 'epic', id: task.epic.id });
  }
  let parentHref: string | null = null;
  if (task.parent) {
    parentHref = AppRoutes.item({ kind: 'task', id: task.parent.id });
  }
  return { copied, copy, copyLabel: copied ? 'Copied' : 'Copy ID', epicHref, parentHref };
};
