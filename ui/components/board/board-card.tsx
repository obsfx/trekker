import { Link } from 'react-router';

import { useBoardCard } from '@/ui/hooks/use-board-card.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import { BoardCardView } from '@/ui/primitives/board-card-view.tsx';
import { DropIndicator } from '@/ui/primitives/drop-indicator.tsx';

interface BoardCardProps {
  item: ItemSummary;
  reorderable: boolean;
  now: number;
}

export function BoardCard({ item, reorderable, now }: BoardCardProps) {
  const { ref, dragging, dropEdge, href, updatedLabel, progress } = useBoardCard(
    item,
    reorderable,
    now
  );
  return (
    <Link
      ref={ref}
      to={href}
      className="relative block cursor-grab pb-1.5 text-inherit no-underline outline-none focus-visible:[&>div]:focus-ring"
    >
      <BoardCardView
        item={item}
        updatedLabel={updatedLabel}
        progress={progress}
        dragging={dragging}
      />
      {dropEdge !== null && <DropIndicator edge={dropEdge} />}
    </Link>
  );
}
