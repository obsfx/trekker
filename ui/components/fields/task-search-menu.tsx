import { Popover } from '@base-ui/react/popover';
import type { ReactElement } from 'react';

import { SearchResultList } from '@/ui/components/search/search-result-list.tsx';
import { useTaskSearchMenu } from '@/ui/hooks/use-task-search-menu.ts';
import type { SearchHit } from '@/ui/lib/gateways.ts';
import { MenuFilterInput } from '@/ui/primitives/menu-filter-input.tsx';
import { MutedHint } from '@/ui/primitives/muted-hint.tsx';
import { PopoverPopupSurface } from '@/ui/primitives/popover-popup-surface.tsx';

interface TaskSearchMenuProps {
  trigger: ReactElement;
  placeholder: string;
  excludeIds: readonly string[];
  includeSubtasks?: boolean;
  onPick: (hit: SearchHit) => void;
}

export function TaskSearchMenu({
  trigger,
  placeholder,
  excludeIds,
  includeSubtasks = true,
  onPick,
}: TaskSearchMenuProps) {
  const search = useTaskSearchMenu(excludeIds, includeSubtasks, onPick);
  return (
    <Popover.Root open={search.open} onOpenChange={search.setOpen}>
      <Popover.Trigger render={trigger} />
      <PopoverPopupSurface align="start" className="w-96">
        <MenuFilterInput
          autoFocus
          value={search.text}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => {
            search.setText(event.target.value);
          }}
          onKeyDown={search.results.onKeyDown}
        />
        {search.idle && <MutedHint>Type a title or an ID</MutedHint>}
        {!search.idle && <SearchResultList {...search.results} emptyLabel="No matching tasks" />}
      </PopoverPopupSurface>
    </Popover.Root>
  );
}
