import { useEffect } from 'react';
import { useStore } from 'zustand';

import type { AsyncResource } from '@/ui/lib/async-resource.ts';

export const useResource = <T>(resource: AsyncResource<T>) => {
  useEffect(() => {
    void resource.load();
    return resource.watch();
  }, [resource]);
  return useStore(resource.store);
};
