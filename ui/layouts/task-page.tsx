import { Link } from 'react-router';

import { TaskDocument } from '@/ui/components/task/task-document.tsx';
import { useTaskPage } from '@/ui/hooks/use-task-page.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import { CenteredStatus } from '@/ui/primitives/centered-status.tsx';
import { Spinner } from '@/ui/primitives/spinner.tsx';

export function TaskPage() {
  const { id, state, failureMessage } = useTaskPage();
  if (state.status === 'ready') {
    return <TaskDocument task={state.data} />;
  }
  if (state.status === 'failed') {
    return (
      <CenteredStatus>
        {failureMessage}
        <Link to={AppRoutes.board} className="text-primary-fg underline">
          Back to the board
        </Link>
      </CenteredStatus>
    );
  }
  return (
    <CenteredStatus>
      <Spinner />
      Loading {id}
    </CenteredStatus>
  );
}
