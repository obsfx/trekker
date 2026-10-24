import { BoardToolbar } from '@/ui/components/board/board-toolbar.tsx';
import { BoardView } from '@/ui/components/board/board-view.tsx';
import { useBoardView } from '@/ui/hooks/use-board-view.ts';
import { PageToolbar } from '@/ui/primitives/page-toolbar.tsx';

export function BoardPage() {
  const view = useBoardView();
  return (
    <>
      <PageToolbar>
        <BoardToolbar />
      </PageToolbar>
      <BoardView view={view} />
    </>
  );
}
