import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AppRoutes } from '@/ui/lib/app-routes.ts';

interface StoryRouterProps {
  path?: string;
  children: ReactNode;
}

export function StoryRouter({ path = '/', children }: StoryRouterProps) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        {AppRoutes.patterns.map((pattern) => {
          return <Route key={pattern} path={pattern} element={children} />;
        })}
        <Route path="*" element={children} />
      </Routes>
    </MemoryRouter>
  );
}
