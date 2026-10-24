import { useDebounce } from '@uidotdev/usehooks';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useSearchResults } from '@/ui/hooks/use-search-results.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import type { SearchHit } from '@/ui/lib/gateways.ts';
import { KeyboardShortcuts } from '@/ui/lib/keyboard-shortcuts.ts';

const SEARCH_DEBOUNCE_MS = 180;
const MIN_QUERY_LENGTH = 2;
const NO_EXCLUSIONS: readonly string[] = [];

export const useGlobalSearch = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(text.trim(), SEARCH_DEBOUNCE_MS);
  let query = '';
  if (debounced.length >= MIN_QUERY_LENGTH) {
    query = debounced;
  }

  const choose = (hit: SearchHit) => {
    void navigate(AppRoutes.item(hit));
    setOpen(false);
    setText('');
    inputRef.current?.blur();
  };
  const results = useSearchResults({ text: query, types: [] }, NO_EXCLUSIONS, choose);

  useEffect(() => {
    return KeyboardShortcuts.bind('/', () => {
      inputRef.current?.focus();
    });
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    results.onKeyDown(event);
  };

  return {
    inputRef,
    text,
    open: open && query !== '',
    results,
    onChange: (value: string) => {
      setText(value);
      setOpen(true);
    },
    onFocus: () => {
      setOpen(true);
    },
    onBlur: () => {
      setOpen(false);
    },
    onKeyDown,
  };
};
