import { useStore } from 'zustand';

import { useServices } from '@/ui/context/services/use-services.ts';

export const useNow = () => {
  const { clock } = useServices();
  return useStore(clock.store, (state) => {
    return state.now;
  });
};
