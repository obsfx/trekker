import type { ReactNode } from 'react';

import { useServices } from '@/ui/context/services/use-services.ts';
import { useResource } from '@/ui/hooks/use-resource.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import { CenteredStatus } from '@/ui/primitives/centered-status.tsx';

interface WithTaskProps {
  id: string;
  children: (task: TaskDetail) => ReactNode;
}

export function WithTask({ id, children }: WithTaskProps) {
  const { taskDetails } = useServices();
  const state = useResource(taskDetails.get(id));
  if (state.status !== 'ready') {
    return (
      <CenteredStatus>{state.status === 'failed' ? state.error.message : 'Loading'}</CenteredStatus>
    );
  }
  return children(state.data);
}
