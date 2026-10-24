import type { ReactNode } from 'react';

import { ServicesContext } from '@/ui/context/services/services-context.ts';
import type { Services } from '@/ui/lib/services.ts';

interface ServicesProviderProps {
  services: Services;
  children: ReactNode;
}

export function ServicesProvider({ services, children }: ServicesProviderProps) {
  return <ServicesContext value={services}>{children}</ServicesContext>;
}
