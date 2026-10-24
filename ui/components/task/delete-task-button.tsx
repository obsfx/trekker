import { TbTrash } from 'react-icons/tb';

import { ConfirmPopover } from '@/ui/components/shared/confirm-popover.tsx';
import { useDeleteTask } from '@/ui/hooks/use-delete-task.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import { IconButton } from '@/ui/primitives/icon-button.tsx';

interface DeleteTaskButtonProps {
  task: TaskDetail;
}

export function DeleteTaskButton({ task }: DeleteTaskButtonProps) {
  const deletion = useDeleteTask(task);
  return (
    <ConfirmPopover
      open={deletion.open}
      title={deletion.title}
      description={deletion.description}
      confirmLabel="Delete"
      tone="danger"
      trigger={
        <IconButton aria-label={`Delete ${task.id}`} title={`Delete ${task.id}`}>
          <TbTrash className="size-3.5" />
        </IconButton>
      }
      onConfirm={deletion.confirm}
      onOpenChange={deletion.setOpen}
    />
  );
}
