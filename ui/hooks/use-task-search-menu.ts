import { useDebounce } from '@uidotdev/usehooks';
import { useState } from 'react';

import { useSearchResults } from '@/ui/hooks/use-search-results.ts';
import type { SearchHit } from '@/ui/lib/gateways.ts';
import type { ItemKind } from '@/ui/lib/item-kinds.ts';

const SEARCH_DEBOUNCE_MS = 150;
const TASK_KINDS: readonly ItemKind[] = ['task'];
const TASK_AND_SUBTASK_KINDS: readonly ItemKind[] = ['task', 'subtask'];

export const useTaskSearchMenu = (
  excludeIds: readonly string[],
  includeSubtasks: boolean,
  onPick: (hit: SearchHit) => void
) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const query = useDebounce(text.trim(), SEARCH_DEBOUNCE_MS);
  let types = TASK_KINDS;
  if (includeSubtasks) {
    types = TASK_AND_SUBTASK_KINDS;
  }

  const pick = (hit: SearchHit) => {
    onPick(hit);
    setOpen(false);
    setText('');
  };
  const results = useSearchResults({ text: query, types }, excludeIds, pick);

  return {
    open,
    setOpen: (next: boolean) => {
      setOpen(next);
      if (!next) {
        setText('');
      }
    },
    text,
    setText,
    idle: query === '',
    results,
  };
};
