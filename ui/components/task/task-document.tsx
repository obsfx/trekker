import { InlineDescription } from '@/ui/components/editing/inline-description.tsx';
import { InlineTitle } from '@/ui/components/editing/inline-title.tsx';
import { DeleteTaskButton } from '@/ui/components/task/delete-task-button.tsx';
import { DependencySection } from '@/ui/components/task/dependency-section.tsx';
import { SubtaskSection } from '@/ui/components/task/subtask-section.tsx';
import { TaskBreadcrumb } from '@/ui/components/task/task-breadcrumb.tsx';
import { TaskProperties } from '@/ui/components/task/task-properties.tsx';
import { TaskTabs } from '@/ui/components/task/task-tabs.tsx';
import { useTaskProperties } from '@/ui/hooks/use-task-properties.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';

interface TaskDocumentProps {
  task: TaskDetail;
}

export function TaskDocument({ task }: TaskDocumentProps) {
  const properties = useTaskProperties(task);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TaskBreadcrumb task={task} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <article className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-4 pb-12">
          <div className="flex items-start gap-2">
            <h1 className="min-w-0 flex-1">
              <InlineTitle
                key={task.id}
                value={task.title}
                label="Title"
                onSave={properties.setTitle}
              />
            </h1>
            <DeleteTaskButton task={task} />
          </div>
          <TaskProperties task={task} properties={properties} />
          <InlineDescription
            key={`description-${task.id}`}
            value={task.description}
            placeholder="Add a description"
            onSave={properties.setDescription}
          />
          {task.kind === 'task' ? <SubtaskSection task={task} /> : null}
          <DependencySection task={task} />
          <TaskTabs key={`tabs-${task.id}`} task={task} />
        </article>
      </div>
    </div>
  );
}
