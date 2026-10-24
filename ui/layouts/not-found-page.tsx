import { Link } from 'react-router';

import { AppRoutes } from '@/ui/lib/app-routes.ts';
import { CenteredStatus } from '@/ui/primitives/centered-status.tsx';

export function NotFoundPage() {
  return (
    <CenteredStatus>
      This page does not exist.
      <Link to={AppRoutes.board} className="text-primary-fg underline">
        Back to the board
      </Link>
    </CenteredStatus>
  );
}
