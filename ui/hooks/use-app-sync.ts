import { useEffect, useEffectEvent } from 'react';
import { useNavigate } from 'react-router';

import { useServices } from '@/ui/context/services/use-services.ts';
import { AppSync } from '@/ui/lib/app-sync.ts';
import { preferencesPort } from '@/ui/store/preferences-store.ts';

export const useAppSync = () => {
  const services = useServices();
  const navigate = useNavigate();
  const open = useEffectEvent((path: string) => {
    void navigate(path);
  });

  useEffect(() => {
    const sync = new AppSync(services, {
      preferences: preferencesPort,
      navigate: (path) => {
        open(path);
      },
    });
    return sync.start();
  }, [services]);
};
