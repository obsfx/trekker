import { TbBolt, TbChevronDown } from 'react-icons/tb';

import { PriorityMenu } from '@/ui/components/editing/priority-menu.tsx';
import { StatusMenu } from '@/ui/components/editing/status-menu.tsx';
import { TagEditor } from '@/ui/components/fields/tag-editor.tsx';
import { EpicMenu } from '@/ui/components/pickers/epic-menu.tsx';
import type { TaskPropertyControls } from '@/ui/hooks/use-task-properties.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { MetaText } from '@/ui/primitives/meta-text.tsx';

interface TaskPropertiesProps {
  task: TaskDetail;
  properties: TaskPropertyControls;
}

export function TaskProperties({ task, properties }: TaskPropertiesProps) {
  const epicLabel = (
    <>
      <TbBolt className="size-3.5 shrink-0 text-accent-fg" />
      <span className="max-w-56 truncate">{task.epic?.title ?? 'No epic'}</span>
    </>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs">
      <StatusMenu
        value={task.status}
        statuses={properties.statuses}
        onChange={properties.setStatus}
      />
      <PriorityMenu value={task.priority} onChange={properties.setPriority} />
      {properties.canChangeEpic && (
        <EpicMenu
          value={task.epic?.id ?? null}
          noneLabel="No epic"
          onChange={properties.setEpic}
          trigger={
            <Button variant="text" className="font-normal text-fg-1" aria-label="Epic">
              {epicLabel}
              <TbChevronDown className="size-3 text-fg-4" />
            </Button>
          }
        />
      )}
      {!properties.canChangeEpic && (
        <span className="flex h-6 items-center gap-1 px-2 text-fg-2">{epicLabel}</span>
      )}
      <span className="px-1">
        <TagEditor tags={task.tags} onChange={properties.setTags} />
      </span>
      <span className="ml-auto flex items-center gap-1">
        <MetaText title={properties.createdTitle}>{properties.created},</MetaText>
        <MetaText title={properties.updatedTitle}>{properties.updated}</MetaText>
      </span>
    </div>
  );
}
