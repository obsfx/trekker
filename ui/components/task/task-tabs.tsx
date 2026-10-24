import { CommentThread } from '@/ui/components/task/comment-thread.tsx';
import { TaskActivity } from '@/ui/components/task/task-activity.tsx';
import { useTaskTab } from '@/ui/hooks/use-task-tab.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import { UnderlineTab } from '@/ui/primitives/underline-tab.tsx';
import { UnderlineTabs } from '@/ui/primitives/underline-tabs.tsx';

interface TaskTabsProps {
  task: TaskDetail;
}

export function TaskTabs({ task }: TaskTabsProps) {
  const { tab, setTab } = useTaskTab();
  return (
    <section className="flex flex-col gap-3">
      <UnderlineTabs label="Task conversation">
        <UnderlineTab
          active={tab === 'comments'}
          onClick={() => {
            setTab('comments');
          }}
        >
          Comments
          <span className="font-normal text-fg-3 tabular-nums">{task.commentCount}</span>
        </UnderlineTab>
        <UnderlineTab
          active={tab === 'activity'}
          onClick={() => {
            setTab('activity');
          }}
        >
          Activity
        </UnderlineTab>
      </UnderlineTabs>
      {tab === 'comments' ? <CommentThread taskId={task.id} /> : <TaskActivity taskId={task.id} />}
    </section>
  );
}
