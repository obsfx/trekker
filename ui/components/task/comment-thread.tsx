import { CommentComposer } from '@/ui/components/task/comment-composer.tsx';
import { CommentItem } from '@/ui/components/task/comment-item.tsx';
import { useCommentThread } from '@/ui/hooks/use-comment-thread.ts';
import { LoadMoreButton } from '@/ui/primitives/load-more-button.tsx';
import { MutedHint } from '@/ui/primitives/muted-hint.tsx';
import { Spinner } from '@/ui/primitives/spinner.tsx';

interface CommentThreadProps {
  taskId: string;
}

export function CommentThread({ taskId }: CommentThreadProps) {
  const thread = useCommentThread(taskId);
  return (
    <div className="flex flex-col gap-2">
      {thread.status === 'loading' && (
        <MutedHint>
          <Spinner />
          Loading comments
        </MutedHint>
      )}
      {thread.status === 'failed' ? <MutedHint>Comments could not be loaded.</MutedHint> : null}
      {thread.status === 'ready' && thread.items.length === 0 && (
        <MutedHint>No comments yet.</MutedHint>
      )}
      {thread.items.map((comment) => {
        return <CommentItem key={comment.id} comment={comment} />;
      })}
      {thread.nextCursor !== null && (
        <LoadMoreButton
          loading={thread.loadingMore}
          shown={thread.items.length}
          total={thread.total}
          next={thread.nextBatch}
          onClick={thread.loadMore}
        />
      )}
      <CommentComposer taskId={taskId} />
    </div>
  );
}
