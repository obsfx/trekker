import { TbArrowBackUp, TbLink } from 'react-icons/tb';

import { DependencyList } from '@/ui/components/task/dependency-list.tsx';
import { useDependencyActions } from '@/ui/hooks/use-dependency-actions.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';

interface DependencySectionProps {
  task: TaskDetail;
}

export function DependencySection({ task }: DependencySectionProps) {
  const actions = useDependencyActions(task);
  return (
    <section aria-label="Dependencies" className="grid grid-cols-2 gap-4">
      <DependencyList
        icon={<TbLink className="size-3.5" />}
        label="Depends on"
        count={actions.dependsOnCount}
        refs={task.dependsOn}
        excludeIds={actions.linkedIds}
        emptyText="Not waiting on anything"
        addLabel="Find a task this depends on"
        onAdd={actions.addDependsOn}
        onRemove={actions.removeDependsOn}
      />
      <DependencyList
        icon={<TbArrowBackUp className="size-3.5" />}
        label="Blocks"
        refs={task.blocks}
        excludeIds={actions.linkedIds}
        emptyText="Blocks nothing"
        addLabel="Find a task this blocks"
        onAdd={actions.addBlocks}
        onRemove={actions.removeBlocks}
      />
    </section>
  );
}
