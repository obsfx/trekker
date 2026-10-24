import { TbPencil, TbTrash } from 'react-icons/tb';

import { ConfirmPopover } from '@/ui/components/shared/confirm-popover.tsx';
import { useCommentItem } from '@/ui/hooks/use-comment-item.ts';
import type { TaskComment } from '@/ui/lib/detail-shapes.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { CommentCard } from '@/ui/primitives/comment-card.tsx';
import { IconButton } from '@/ui/primitives/icon-button.tsx';
import { MarkdownView } from '@/ui/primitives/markdown-view.tsx';
import { TextAreaField } from '@/ui/primitives/text-area-field.tsx';

interface CommentItemProps {
  comment: TaskComment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const item = useCommentItem(comment);
  return (
    <CommentCard
      author={comment.author}
      time={item.time}
      timeTitle={item.timeTitle}
      edited={item.edited}
      actions={
        !item.editing && (
          <>
            <IconButton aria-label="Edit comment" className="size-5" onClick={item.start}>
              <TbPencil className="size-3" />
            </IconButton>
            <ConfirmPopover
              open={item.confirming}
              title="Delete this comment?"
              description="The comment is removed for everyone. This cannot be undone."
              confirmLabel="Delete comment"
              tone="danger"
              trigger={
                <IconButton aria-label="Delete comment" className="size-5">
                  <TbTrash className="size-3" />
                </IconButton>
              }
              onConfirm={item.remove}
              onOpenChange={item.setConfirming}
            />
          </>
        )
      }
    >
      {item.editing && (
        <div className="flex flex-col gap-1.5 py-1">
          <TextAreaField
            autoFocus
            rows={4}
            aria-label="Edit comment"
            value={item.draft}
            onChange={(event) => {
              item.setDraft(event.target.value);
            }}
            onKeyDown={item.onKeyDown}
          />
          <div className="flex justify-end gap-1">
            <Button variant="text" onClick={item.cancel}>
              Cancel
            </Button>
            <Button variant="solid" disabled={item.busy} onClick={item.save}>
              Save
            </Button>
          </div>
        </div>
      )}
      {!item.editing && <MarkdownView source={comment.content} />}
    </CommentCard>
  );
}
