import { useParams } from 'react-router';

import { useServices } from '@/ui/context/services/use-services.ts';
import { useResource } from '@/ui/hooks/use-resource.ts';
import { ApiError } from '@/ui/lib/api-client.ts';

export const useTaskPage = () => {
  const { id = '' } = useParams();
  const { taskDetails } = useServices();
  const state = useResource(taskDetails.get(id));
  let failureMessage = `${id} could not be loaded.`;
  if (state.status === 'failed' && ApiError.isNotFound(state.error)) {
    failureMessage = `${id} does not exist or was deleted.`;
  }
  return { id, state, failureMessage };
};
