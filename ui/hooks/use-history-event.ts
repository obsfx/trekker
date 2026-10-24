import type { HistoryEvent } from '@/ui/lib/history-shapes.ts';
import { HistoryLabels } from '@/ui/lib/history-labels.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';

export const useHistoryEvent = (event: HistoryEvent) => {
  const description = HistoryLabels.describe(event);
  return {
    ...description,
    href: description.target ? AppRoutes.item(description.target) : null,
  };
};
