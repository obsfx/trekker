import { type KeyboardEvent, useState } from 'react';

import { TextQueries } from '@/ui/lib/text-queries.ts';

interface InlineTextOptions {
  value: string;
  required: boolean;
  submitWithModifier: boolean;
  onSave: (next: string) => void;
}

export const useInlineText = ({
  value,
  required,
  submitWithModifier,
  onSave,
}: InlineTextOptions) => {
  const [draft, setDraft] = useState<string | null>(null);
  const cancel = () => {
    setDraft(null);
  };
  const commit = () => {
    if (draft === null) {
      return;
    }
    let next = draft;
    if (required) {
      next = draft.trim();
    }
    setDraft(null);
    if (next === value || (required && TextQueries.isBlank(next))) {
      return;
    }
    onSave(next);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const modified = event.metaKey || event.ctrlKey;
    if (event.key === 'Enter' && modified === submitWithModifier) {
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };
  return {
    editing: draft !== null,
    draft: draft ?? value,
    start: () => {
      setDraft(value);
    },
    change: (next: string) => {
      setDraft(next);
    },
    cancel,
    commit,
    onKeyDown,
  };
};
