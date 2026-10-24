import { Link } from 'react-router';

import { useRouteErrorPage } from '@/ui/hooks/use-route-error-page.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { CenteredStatus } from '@/ui/primitives/centered-status.tsx';

export function RouteErrorPage() {
  const page = useRouteErrorPage();
  return (
    <CenteredStatus>
      Something went wrong. {page.message}
      <Button variant="secondary" onClick={page.reload}>
        Reload
      </Button>
      <Link to={AppRoutes.board} className="text-primary-fg underline">
        Back to the board
      </Link>
    </CenteredStatus>
  );
}
