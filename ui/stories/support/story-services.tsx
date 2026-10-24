import { type ReactNode, useState } from 'react';

import { ServicesProvider } from '@/ui/context/services/services-provider.tsx';
import { InMemoryTrekker, type SeedOptions } from '@/ui/lib/in-memory-trekker.ts';
import { Services } from '@/ui/lib/services.ts';
import { StoryRouter } from '@/ui/stories/support/story-router.tsx';
import { noticePort } from '@/ui/store/notice-store.ts';

interface StoryServicesProps {
  path?: string;
  seed?: SeedOptions;
  latencyMs?: number;
  prepare?: (trekker: InMemoryTrekker) => void;
  children: ReactNode;
}

export function StoryServices({
  path = '/',
  seed,
  latencyMs = 0,
  prepare,
  children,
}: StoryServicesProps) {
  const [services] = useState(() => {
    const trekker = new InMemoryTrekker(seed);
    trekker.latencyMs = latencyMs;
    prepare?.(trekker);
    return new Services(trekker.gateways(), noticePort);
  });
  return (
    <ServicesProvider services={services}>
      <StoryRouter path={path}>{children}</StoryRouter>
    </ServicesProvider>
  );
}
