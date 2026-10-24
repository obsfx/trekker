import { TbBolt, TbChevronDown } from 'react-icons/tb';

import { DateFilterMenu } from '@/ui/components/filters/date-filter-menu.tsx';
import { CheckMenu } from '@/ui/components/list/check-menu.tsx';
import { SortMenu } from '@/ui/components/list/sort-menu.tsx';
import { EpicMenu } from '@/ui/components/pickers/epic-menu.tsx';
import { useListToolbar } from '@/ui/hooks/use-list-toolbar.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { PriorityIcon } from '@/ui/primitives/priority-icon.tsx';
import { StatusIcon } from '@/ui/primitives/status-icon.tsx';

const LIST_DATE_FIELDS = ['updated', 'created'] as const;

export function ListToolbar() {
  const toolbar = useListToolbar();
  return (
    <>
      <CheckMenu
        label="Type"
        options={toolbar.typeOptions}
        selected={toolbar.types}
        onToggle={toolbar.toggleType}
        onClear={toolbar.clearTypes}
      />
      <CheckMenu
        label="Status"
        options={toolbar.statusOptions.map((option) => {
          return { ...option, icon: <StatusIcon status={option.value} /> };
        })}
        selected={toolbar.statuses}
        onToggle={toolbar.toggleStatus}
        onClear={toolbar.clearStatuses}
      />
      <CheckMenu
        label="Priority"
        options={toolbar.priorityOptions.map((option) => {
          return { ...option, icon: <PriorityIcon priority={option.value} /> };
        })}
        selected={toolbar.priorities}
        onToggle={toolbar.togglePriority}
        onClear={toolbar.clearPriorities}
      />
      <EpicMenu
        value={toolbar.epicId}
        noneLabel="Any epic"
        onChange={toolbar.setEpicId}
        trigger={
          <Button variant={toolbar.epicId === null ? 'text' : 'subtle'} aria-label="Epic">
            {toolbar.epicId === null ? null : <TbBolt className="size-3.5 text-accent-fg" />}
            Epic
            {toolbar.epicId !== null && (
              <span className="font-mono font-normal">{toolbar.epicId}</span>
            )}
            <TbChevronDown className="size-3" />
          </Button>
        }
      />
      <DateFilterMenu
        filter={toolbar.dateFilter}
        fields={LIST_DATE_FIELDS}
        onChange={toolbar.setDateFilter}
      />
      <span className="ml-auto" />
      <SortMenu sort={toolbar.sort} fields={toolbar.sortFields} onChange={toolbar.setSort} />
    </>
  );
}
