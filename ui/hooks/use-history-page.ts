import { useServices } from '@/ui/context/services/use-services.ts';
import { useNow } from '@/ui/hooks/use-now.ts';
import { usePagedList } from '@/ui/hooks/use-paged-list.ts';
import { CountLabels } from '@/ui/lib/count-labels.ts';
import { DateRanges } from '@/ui/lib/date-ranges.ts';
import { HistoryRows } from '@/ui/lib/history-rows.ts';
import { useHistoryViewStore } from '@/ui/store/history-view-store.ts';

export const useHistoryPage = () => {
  const { history } = useServices();
  const now = useNow();
  const types = useHistoryViewStore((state) => {
    return state.types;
  });
  const actions = useHistoryViewStore((state) => {
    return state.actions;
  });
  const dateFilter = useHistoryViewStore((state) => {
    return state.dateFilter;
  });
  const range = DateRanges.resolve(dateFilter, now);
  const page = usePagedList(
    history.get({
      types,
      actions,
      entityId: null,
      from: range?.from ?? null,
      to: range?.to ?? null,
    })
  );
  return {
    ...page,
    rows: HistoryRows.group(page.items, now),
    totalLabel: CountLabels.of(page.total, 'event'),
  };
};
