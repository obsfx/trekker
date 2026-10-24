import { createBrowserRouter, type RouteObject } from 'react-router';

import { AppLayout } from '@/ui/layouts/app-layout.tsx';
import { BoardPage } from '@/ui/layouts/board-page.tsx';
import { EpicPage } from '@/ui/layouts/epic-page.tsx';
import { HistoryPage } from '@/ui/layouts/history-page.tsx';
import { ListPage } from '@/ui/layouts/list-page.tsx';
import { NotFoundPage } from '@/ui/layouts/not-found-page.tsx';
import { RouteErrorPage } from '@/ui/layouts/route-error-page.tsx';
import { SettingsPage } from '@/ui/layouts/settings-page.tsx';
import { TaskPage } from '@/ui/layouts/task-page.tsx';
import { AppRoutes } from '@/ui/lib/app-routes.ts';

export abstract class AppRouter {
  static readonly routes: RouteObject[] = [
    {
      Component: AppLayout,
      ErrorBoundary: RouteErrorPage,
      children: [
        {
          ErrorBoundary: RouteErrorPage,
          children: [
            { path: AppRoutes.board, Component: BoardPage },
            { path: AppRoutes.list, Component: ListPage },
            { path: AppRoutes.history, Component: HistoryPage },
            { path: AppRoutes.task, Component: TaskPage },
            { path: AppRoutes.epic, Component: EpicPage },
            { path: AppRoutes.settings, Component: SettingsPage },
            { path: '*', Component: NotFoundPage },
          ],
        },
      ],
    },
  ];

  static browser() {
    return createBrowserRouter(AppRouter.routes);
  }
}
