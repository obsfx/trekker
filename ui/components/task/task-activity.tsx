import { HistoryEventRow } from '@/ui/components/history/history-event-row.tsx';
import { useTaskActivity } from '@/ui/hooks/use-task-activity.ts';
import { LoadMoreButton } from '@/ui/primitives/load-more-button.tsx';
import { MutedHint } from '@/ui/primitives/muted-hint.tsx';
import { Spinner } from '@/ui/primitives/spinner.tsx';

interface TaskActivityProps {
  taskId: string;
}

export function TaskActivity({ taskId }: TaskActivityProps) {
  const activity = useTaskActivity(taskId);
  return (
    <div className="-mx-3 flex flex-col">
      {activity.status === 'loading' && (
        <MutedHint>
          <Spinner />
          Loading activity
        </MutedHint>
      )}
      {activity.status === 'failed' ? <MutedHint>Activity could not be loaded.</MutedHint> : null}
      {activity.status === 'ready' && activity.items.length === 0 && (
        <MutedHint>No activity yet.</MutedHint>
      )}
      {activity.items.map((event) => {
        return <HistoryEventRow key={event.id} event={event} />;
      })}
      {activity.nextCursor !== null && (
        <LoadMoreButton
          loading={activity.loadingMore}
          shown={activity.items.length}
          total={activity.total}
          next={activity.nextBatch}
          onClick={activity.loadMore}
        />
      )}
    </div>
  );
}
