import { SearchResultList } from '@/ui/components/search/search-result-list.tsx';
import { useGlobalSearch } from '@/ui/hooks/use-global-search.ts';
import { PopoverPanel } from '@/ui/primitives/popover-panel.tsx';
import { SearchField } from '@/ui/primitives/search-field.tsx';

export function GlobalSearch() {
  const { inputRef, text, open, results, onChange, onFocus, onBlur, onKeyDown } = useGlobalSearch();
  return (
    <div className="relative ml-auto w-80 min-w-24 shrink">
      <SearchField
        ref={inputRef}
        value={text}
        placeholder="Search tasks and epics"
        shortcut="/"
        aria-label="Search"
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {open && (
        <PopoverPanel className="right-0 left-0">
          <SearchResultList {...results} emptyLabel="No matches" />
        </PopoverPanel>
      )}
    </div>
  );
}
