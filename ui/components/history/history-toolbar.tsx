import { DateFilterMenu } from '@/ui/components/filters/date-filter-menu.tsx';
import { CheckMenu } from '@/ui/components/list/check-menu.tsx';
import { useHistoryFilters } from '@/ui/hooks/use-history-filters.ts';
import { MetaText } from '@/ui/primitives/meta-text.tsx';
import { PageToolbar } from '@/ui/primitives/page-toolbar.tsx';

const HISTORY_DATE_FIELDS = ['updated'] as const;

interface HistoryToolbarProps {
  totalLabel: string;
}

export function HistoryToolbar({ totalLabel }: HistoryToolbarProps) {
  const filters = useHistoryFilters();
  return (
    <PageToolbar>
      <CheckMenu
        label="Type"
        options={filters.typeOptions}
        selected={filters.types}
        onToggle={filters.toggleType}
        onClear={filters.clearTypes}
      />
      <CheckMenu
        label="Action"
        options={filters.actionOptions}
        selected={filters.actions}
        onToggle={filters.toggleAction}
        onClear={filters.clearActions}
      />
      <DateFilterMenu
        filter={filters.dateFilter}
        fields={HISTORY_DATE_FIELDS}
        label="Date"
        onChange={filters.setDateFilter}
      />
      <span className="ml-auto">
        <MetaText>{totalLabel}</MetaText>
      </span>
    </PageToolbar>
  );
}
