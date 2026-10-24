import { TbBolt, TbCheck, TbCopy } from 'react-icons/tb';
import { Link } from 'react-router';

import { useTaskBreadcrumb } from '@/ui/hooks/use-task-breadcrumb.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import { CrumbBar } from '@/ui/primitives/crumb-bar.tsx';
import { CrumbSeparator } from '@/ui/primitives/crumb-separator.tsx';
import { IconButton } from '@/ui/primitives/icon-button.tsx';

interface TaskBreadcrumbProps {
  task: TaskDetail;
}

export function TaskBreadcrumb({ task }: TaskBreadcrumbProps) {
  const { copied, copy, copyLabel, epicHref, parentHref } = useTaskBreadcrumb(task);
  return (
    <CrumbBar>
      <Link to={AppRoutes.board} className="hover:text-fg-1">
        Board
      </Link>
      <CrumbSeparator />
      {task.epic && epicHref !== null && (
        <>
          <Link to={epicHref} className="flex min-w-0 items-center gap-1 hover:text-fg-1">
            <TbBolt className="size-3.5 shrink-0 text-accent-fg" />
            <span className="font-mono">{task.epic.id}</span>
            <span className="max-w-64 truncate">{task.epic.title}</span>
          </Link>
          <CrumbSeparator />
        </>
      )}
      {task.parent && parentHref !== null && (
        <>
          <Link to={parentHref} className="flex min-w-0 items-center gap-1 hover:text-fg-1">
            <span className="font-mono">{task.parent.id}</span>
            <span className="max-w-64 truncate">{task.parent.title}</span>
          </Link>
          <CrumbSeparator />
        </>
      )}
      <span className="font-mono text-fg-1">{task.id}</span>
      <IconButton aria-label={copyLabel} className="size-5" onClick={copy}>
        {copied ? <TbCheck className="size-3 text-success-fg" /> : <TbCopy className="size-3" />}
      </IconButton>
    </CrumbBar>
  );
}
