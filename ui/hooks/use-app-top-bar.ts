import { useStore } from 'zustand';

import { useServices } from '@/ui/context/services/use-services.ts';
import { useResource } from '@/ui/hooks/use-resource.ts';
import { AppGlobals } from '@/ui/lib/app-globals.ts';
import { ResourceStates } from '@/ui/lib/async-resource.ts';
import { useCreateDialogStore } from '@/ui/store/create-dialog-store.ts';

export const useAppTopBar = () => {
  const services = useServices();
  const project = ResourceStates.dataOr(useResource(services.project), null);
  const live = useStore(services.events.status, (state) => {
    return state.state;
  });
  const showCreate = useCreateDialogStore((state) => {
    return state.show;
  });
  const injected = AppGlobals.read().project;
  return {
    projectName: project?.name ?? injected?.name ?? 'trekker',
    projectRoot: project?.root ?? injected?.root ?? '',
    live,
    create: () => {
      showCreate();
    },
  };
};
