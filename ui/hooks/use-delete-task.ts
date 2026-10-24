import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useServices } from '@/ui/context/services/use-services.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import { DeleteLabels } from '@/ui/lib/delete-labels.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';

export const useDeleteTask = (task: TaskDetail) => {
  const { taskActions } = useServices();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const confirm = async () => {
    const removed = await taskActions.remove(task.id);
    if (!removed) {
      return;
    }
    if (task.parent) {
      void navigate(AppRoutes.item({ kind: 'task', id: task.parent.id }));
      return;
    }
    void navigate(AppRoutes.board);
  };

  return {
    open,
    setOpen,
    title: `Delete ${task.id}?`,
    description: DeleteLabels.task(task),
    confirm: () => {
      void confirm();
    },
  };
};
