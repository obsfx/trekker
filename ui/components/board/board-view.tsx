import { BoardColumn } from '@/ui/components/board/board-column.tsx';
import { useBoardDropMonitor } from '@/ui/hooks/use-board-drop-monitor.ts';
import { useNow } from '@/ui/hooks/use-now.ts';
import type { BoardView as BoardViewModel } from '@/ui/lib/board.ts';
import { ItemStatuses } from '@/ui/lib/item-statuses.ts';

interface BoardViewProps {
  view: BoardViewModel;
}

export function BoardView({ view }: BoardViewProps) {
  useBoardDropMonitor(view);
  const now = useNow();
  return (
    <div className="flex min-h-0 flex-1 gap-2 overflow-x-auto p-2">
      {ItemStatuses.board.map((status) => {
        return <BoardColumn key={status} view={view} status={status} now={now} />;
      })}
    </div>
  );
}
