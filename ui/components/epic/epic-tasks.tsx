import { ItemTable } from '@/ui/components/items/item-table.tsx';
import { useEpicTasks } from '@/ui/hooks/use-epic-tasks.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import { UnderlineTab } from '@/ui/primitives/underline-tab.tsx';
import { UnderlineTabs } from '@/ui/primitives/underline-tabs.tsx';

interface EpicTasksProps {
  epicId: string;
  counts: Record<ItemStatus, number>;
}

export function EpicTasks({ epicId, counts }: EpicTasksProps) {
  const tasks = useEpicTasks(epicId, counts);
  return (
    <>
      <UnderlineTabs label="Task status">
        {tasks.tabs.map((tab) => {
          return (
            <UnderlineTab
              key={tab.key}
              active={tasks.tab === tab.key}
              onClick={() => {
                tasks.setTab(tab.key);
              }}
            >
              {tab.label}
              <span className="font-normal text-fg-4 tabular-nums">{tab.count}</span>
            </UnderlineTab>
          );
        })}
      </UnderlineTabs>
      <ItemTable
        list={tasks.list}
        sort={tasks.sort}
        showEpic={false}
        emptyLabel={tasks.emptyLabel}
        onSort={tasks.toggleSort}
      />
    </>
  );
}
