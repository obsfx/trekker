import { type KeyboardEvent, useState } from 'react';

import { TagLists } from '@/ui/lib/tag-lists.ts';

export const useTagEditor = (tags: string[], onChange: (tags: string[]) => void) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const next = TagLists.add(tags, draft);
    setDraft('');
    if (!TagLists.same(next, tags)) {
      onChange(next);
    }
  };

  const remove = (tag: string) => {
    onChange(TagLists.remove(tags, tag));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add();
      return;
    }
    const last = tags.at(-1);
    if (event.key === 'Backspace' && draft === '' && last !== undefined) {
      remove(last);
      return;
    }
    if (event.key === 'Escape') {
      setDraft('');
    }
  };

  return { draft, setDraft, add, remove, onKeyDown };
};
