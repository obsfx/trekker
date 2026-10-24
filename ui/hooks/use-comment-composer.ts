import { type KeyboardEvent, useState } from 'react';

import { useServices } from '@/ui/context/services/use-services.ts';
import { KeyChords } from '@/ui/lib/key-chords.ts';
import { TextQueries } from '@/ui/lib/text-queries.ts';
import { usePreferencesStore } from '@/ui/store/preferences-store.ts';

export const useCommentComposer = (taskId: string) => {
  const { taskActions } = useServices();
  const author = usePreferencesStore((state) => {
    return state.author;
  });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const canSubmit = !TextQueries.isBlank(text) && !busy;

  const submit = async () => {
    const content = text.trim();
    if (content === '' || busy) {
      return;
    }
    setBusy(true);
    const added = await taskActions.addComment(taskId, author, content);
    setBusy(false);
    if (added) {
      setText('');
    }
  };

  return {
    author,
    text,
    setText,
    busy,
    canSubmit,
    expanded: focused || text !== '',
    submitModifier: KeyChords.submitModifier(),
    onFocus: () => {
      setFocused(true);
    },
    onBlur: () => {
      setFocused(false);
    },
    cancel: () => {
      setText('');
    },
    submit: () => {
      void submit();
    },
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (KeyChords.isSubmit(event)) {
        event.preventDefault();
        void submit();
      }
    },
  };
};
