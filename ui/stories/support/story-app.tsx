import { useState } from 'react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { AppRouter } from '@/ui/app-router.ts';
import { ServicesProvider } from '@/ui/context/services/services-provider.tsx';
import { InMemoryTrekker } from '@/ui/lib/in-memory-trekker.ts';
import { Services } from '@/ui/lib/services.ts';
import { noticePort } from '@/ui/store/notice-store.ts';

interface StoryAppProps {
  path?: string;
}

export function StoryApp({ path = '/' }: StoryAppProps) {
  const [services] = useState(() => {
    return new Services(new InMemoryTrekker().gateways(), noticePort);
  });
  const [router] = useState(() => {
    return createMemoryRouter(AppRouter.routes, { initialEntries: [path] });
  });
  return (
    <ServicesProvider services={services}>
      <div className="h-screen">
        <RouterProvider router={router} />
      </div>
    </ServicesProvider>
  );
}
