import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { useServices } from '@/ui/context/services/use-services.ts';
import { useNow } from '@/ui/hooks/use-now.ts';
import { useResource } from '@/ui/hooks/use-resource.ts';
import { ApiError } from '@/ui/lib/api-client.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import { ResourceStates } from '@/ui/lib/async-resource.ts';
import type { EpicPatch } from '@/ui/lib/gateways.ts';
import { KindStatuses } from '@/ui/lib/kind-statuses.ts';
import { RelativeTime } from '@/ui/lib/relative-time.ts';
import { StatusCounts } from '@/ui/lib/status-counts.ts';
import { useCreateDialogStore } from '@/ui/store/create-dialog-store.ts';

export const useEpicPage = () => {
  const { id = '' } = useParams();
  const services = useServices();
  const navigate = useNavigate();
  const now = useNow();
  const state = useResource(services.epicDetails.get(id));
  const showCreate = useCreateDialogStore((store) => {
    return store.show;
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLButtonElement | null>(null);
  const epic = ResourceStates.dataOr(state, null);

  const update = (patch: EpicPatch) => {
    void services.epicActions.update(id, patch);
  };

  return {
    id,
    epic,
    loading: state.status === 'idle' || state.status === 'loading',
    missing: state.status === 'failed' && ApiError.isNotFound(state.error),
    failure: state.status === 'failed' ? state.error.message : null,
    statuses: KindStatuses.of('epic'),
    summary: epic ? StatusCounts.summary(epic.statusCounts) : '',
    segments: epic ? StatusCounts.segments(epic.statusCounts) : [],
    createdLabel: epic ? RelativeTime.full(epic.createdAt) : '',
    updatedLabel: epic ? RelativeTime.ago(epic.updatedAt, now) : '',
    updatedTitle: epic ? RelativeTime.full(epic.updatedAt) : '',
    confirmingDelete,
    setConfirmingDelete,
    actionsAnchor,
    setActionsAnchor,
    update,
    addTask: () => {
      showCreate({ kind: 'task', epicId: id });
    },
    remove: async () => {
      setConfirmingDelete(false);
      const removed = await services.epicActions.remove(id);
      if (removed) {
        void navigate(AppRoutes.board);
      }
    },
    retry: () => {
      void services.epicDetails.get(id).reload();
    },
  };
};
