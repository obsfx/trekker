import { HistoryFilters } from '@/ui/lib/history-filters.ts';
import { useHistoryViewStore } from '@/ui/store/history-view-store.ts';

export const useHistoryFilters = () => {
  const types = useHistoryViewStore((state) => {
    return state.types;
  });
  const actions = useHistoryViewStore((state) => {
    return state.actions;
  });
  const toggleType = useHistoryViewStore((state) => {
    return state.toggleType;
  });
  const toggleAction = useHistoryViewStore((state) => {
    return state.toggleAction;
  });
  const clearTypes = useHistoryViewStore((state) => {
    return state.clearTypes;
  });
  const clearActions = useHistoryViewStore((state) => {
    return state.clearActions;
  });
  const dateFilter = useHistoryViewStore((state) => {
    return state.dateFilter;
  });
  const setDateFilter = useHistoryViewStore((state) => {
    return state.setDateFilter;
  });
  return {
    types,
    actions,
    typeOptions: HistoryFilters.typeOptions,
    actionOptions: HistoryFilters.actionOptions,
    toggleType,
    toggleAction,
    clearTypes,
    clearActions,
    dateFilter,
    setDateFilter,
  };
};
