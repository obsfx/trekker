import { TbSubtask } from 'react-icons/tb';
import { Link } from 'react-router';

import { useSubtaskSection } from '@/ui/hooks/use-subtask-section.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import { AddInput } from '@/ui/primitives/add-input.tsx';
import { DocSectionHeading } from '@/ui/primitives/doc-section-heading.tsx';
import { LinkedItemRow } from '@/ui/primitives/linked-item-row.tsx';

interface SubtaskSectionProps {
  task: TaskDetail;
}

export function SubtaskSection({ task }: SubtaskSectionProps) {
  const { composer, rows, count } = useSubtaskSection(task);
  return (
    <section aria-label="Subtasks" className="flex flex-col gap-0.5">
      <DocSectionHeading icon={<TbSubtask className="size-3.5" />} label="Subtasks" count={count} />
      {rows.map((subtask) => {
        return (
          <LinkedItemRow
            key={subtask.id}
            itemId={subtask.id}
            status={subtask.status}
            priority={subtask.priority}
            done={subtask.done}
            title={
              <Link to={subtask.href} className="hover:underline">
                {subtask.title}
              </Link>
            }
          />
        );
      })}
      <AddInput
        aria-label="Add subtask"
        placeholder="Add subtask, Enter to create"
        value={composer.title}
        disabled={composer.busy}
        onChange={(event) => {
          composer.setTitle(event.target.value);
        }}
        onKeyDown={composer.onKeyDown}
      />
    </section>
  );
}
