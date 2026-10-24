import type { DataRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { ServicesProvider } from '@/ui/context/services/services-provider.tsx';
import type { Services } from '@/ui/lib/services.ts';

interface AppProps {
  services: Services;
  router: DataRouter;
}

export function App({ services, router }: AppProps) {
  return (
    <ServicesProvider services={services}>
      <RouterProvider router={router} />
    </ServicesProvider>
  );
}
