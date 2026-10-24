import { useCommentComposer } from '@/ui/hooks/use-comment-composer.ts';
import { AuthorAvatar } from '@/ui/primitives/author-avatar.tsx';
import { Button } from '@/ui/primitives/button.tsx';
import { SubmitHint } from '@/ui/primitives/submit-hint.tsx';
import { TextAreaField } from '@/ui/primitives/text-area-field.tsx';

interface CommentComposerProps {
  taskId: string;
}

export function CommentComposer({ taskId }: CommentComposerProps) {
  const composer = useCommentComposer(taskId);
  return (
    <div className="flex gap-2">
      <AuthorAvatar name={composer.author} />
      <div className="flex flex-1 flex-col gap-1.5">
        <TextAreaField
          rows={composer.expanded ? 4 : 1}
          aria-label="New comment"
          placeholder={`Comment as ${composer.author}`}
          value={composer.text}
          onChange={(event) => {
            composer.setText(event.target.value);
          }}
          onFocus={composer.onFocus}
          onBlur={composer.onBlur}
          onKeyDown={composer.onKeyDown}
        />
        {composer.expanded && (
          <div className="flex items-center justify-end gap-1">
            <SubmitHint modifier={composer.submitModifier} action="to send" className="mr-auto" />
            <Button variant="text" onClick={composer.cancel}>
              Cancel
            </Button>
            <Button variant="solid" disabled={!composer.canSubmit} onClick={composer.submit}>
              Comment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
