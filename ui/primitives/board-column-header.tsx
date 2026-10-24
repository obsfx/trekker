import { TbPlus } from 'react-icons/tb';

import { type ItemStatus, ItemStatuses } from '@/ui/lib/item-statuses.ts';
import { IconButton } from '@/ui/primitives/icon-button.tsx';
import { StatusIcon } from '@/ui/primitives/status-icon.tsx';

interface BoardColumnHeaderProps {
  status: ItemStatus;
  total: number;
  onAdd: () => void;
}

export function BoardColumnHeader({ status, total, onAdd }: BoardColumnHeaderProps) {
  const label = ItemStatuses.label(status);
  return (
    <header className="flex h-6 shrink-0 items-center gap-1.5 px-1 text-xs">
      <StatusIcon status={status} />
      <h2 className="font-semibold text-fg-1">{label}</h2>
      <span className="text-fg-3 tabular-nums">{total}</span>
      <IconButton aria-label={`New in ${label}`} className="ml-auto size-5" onClick={onAdd}>
        <TbPlus className="size-3.5" />
      </IconButton>
    </header>
  );
}
