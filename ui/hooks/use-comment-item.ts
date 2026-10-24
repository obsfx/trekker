import { type KeyboardEvent, useState } from 'react';

import { useServices } from '@/ui/context/services/use-services.ts';
import type { TaskComment } from '@/ui/lib/detail-shapes.ts';
import { KeyChords } from '@/ui/lib/key-chords.ts';
import { RelativeTime } from '@/ui/lib/relative-time.ts';

export const useCommentItem = (comment: TaskComment) => {
  const { taskActions } = useServices();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const content = draft.trim();
    if (content === '' || busy) {
      return;
    }
    if (content === comment.content) {
      setEditing(false);
      return;
    }
    setBusy(true);
    const saved = await taskActions.updateComment(comment.taskId, comment.id, content);
    setBusy(false);
    if (saved) {
      setEditing(false);
    }
  };

  return {
    editing,
    draft,
    setDraft,
    busy,
    confirming,
    setConfirming,
    time: RelativeTime.short(comment.createdAt),
    timeTitle: RelativeTime.full(comment.createdAt),
    edited: comment.updatedAt > comment.createdAt,
    start: () => {
      setDraft(comment.content);
      setEditing(true);
    },
    cancel: () => {
      setEditing(false);
    },
    save: () => {
      void save();
    },
    remove: () => {
      void taskActions.removeComment(comment.taskId, comment.id);
    },
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (KeyChords.isSubmit(event)) {
        event.preventDefault();
        void save();
        return;
      }
      if (KeyChords.isEscape(event)) {
        event.preventDefault();
        setEditing(false);
      }
    },
  };
};
