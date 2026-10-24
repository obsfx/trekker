import { Link } from 'react-router';

import { EpicHeader } from '@/ui/components/epic/epic-header.tsx';
import { EpicTasks } from '@/ui/components/epic/epic-tasks.tsx';
import { ConfirmPopover } from '@/ui/components/shared/confirm-popover.tsx';
import { useEpicPage } from '@/ui/hooks/use-epic-page.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { CenteredStatus } from '@/ui/primitives/centered-status.tsx';
import { Spinner } from '@/ui/primitives/spinner.tsx';

export function EpicPage() {
  const page = useEpicPage();
  if (page.missing) {
    return (
      <CenteredStatus>
        {page.id} does not exist or was deleted.
        <Link to={AppRoutes.board} className="text-primary-fg underline">
          Back to the board
        </Link>
      </CenteredStatus>
    );
  }
  if (page.failure !== null) {
    return (
      <CenteredStatus>
        Could not load {page.id}. {page.failure}
        <Button variant="secondary" onClick={page.retry}>
          Retry
        </Button>
      </CenteredStatus>
    );
  }
  if (page.loading || page.epic === null) {
    return (
      <CenteredStatus>
        <Spinner />
        Loading {page.id}
      </CenteredStatus>
    );
  }
  return (
    <>
      <EpicHeader
        epic={page.epic}
        statuses={page.statuses}
        summary={page.summary}
        segments={page.segments}
        createdLabel={page.createdLabel}
        updatedLabel={page.updatedLabel}
        updatedTitle={page.updatedTitle}
        onUpdate={page.update}
        onAddTask={page.addTask}
        onDelete={() => {
          page.setConfirmingDelete(true);
        }}
        actionsRef={page.setActionsAnchor}
      />
      <EpicTasks epicId={page.epic.id} counts={page.epic.statusCounts} />
      <ConfirmPopover
        open={page.confirmingDelete}
        anchor={page.actionsAnchor}
        title={`Delete ${page.epic.id}?`}
        description="The epic is removed. Its tasks stay and lose the epic link."
        confirmLabel="Delete epic"
        tone="danger"
        onConfirm={() => {
          void page.remove();
        }}
        onOpenChange={page.setConfirmingDelete}
      />
    </>
  );
}
