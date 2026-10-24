import { clsx } from 'clsx';
import { TbChevronDown, TbSubtask } from 'react-icons/tb';

import { TaskSearchMenu } from '@/ui/components/fields/task-search-menu.tsx';
import type { ParentChoice } from '@/ui/lib/create-forms.ts';
import type { SearchHit } from '@/ui/lib/gateways.ts';
import { Button } from '@/ui/primitives/button.tsx';

interface ParentTaskFieldProps {
  parent: ParentChoice | null;
  invalid: boolean;
  onPick: (hit: SearchHit) => void;
}

export function ParentTaskField({ parent, invalid, onPick }: ParentTaskFieldProps) {
  return (
    <TaskSearchMenu
      placeholder="Find the parent task"
      excludeIds={[]}
      includeSubtasks={false}
      onPick={onPick}
      trigger={
        <Button
          variant="text"
          aria-label="Parent task"
          className={clsx('max-w-72 font-normal', invalid ? 'text-danger-fg' : 'text-fg-1')}
        >
          <TbSubtask className="size-3.5 shrink-0" />
          {parent && (
            <>
              <span className="font-mono text-mini text-fg-3">{parent.id}</span>
              <span className="truncate">{parent.title}</span>
            </>
          )}
          {!parent && 'Choose parent task'}
          <TbChevronDown className="size-3 text-fg-4" />
        </Button>
      }
    />
  );
}
