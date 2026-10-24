import { Menu } from '@base-ui/react/menu';
import type { ReactElement } from 'react';
import { TbBolt, TbX } from 'react-icons/tb';

import { useEpicOptions } from '@/ui/hooks/use-epic-options.ts';
import { MenuFilterInput } from '@/ui/primitives/menu-filter-input.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';
import { MenuRadioOption } from '@/ui/primitives/menu-radio-option.tsx';
import { MutedHint } from '@/ui/primitives/muted-hint.tsx';
import { Spinner } from '@/ui/primitives/spinner.tsx';

const NONE = '';

interface EpicMenuProps {
  value: string | null;
  noneLabel: string;
  align?: 'start' | 'end';
  trigger: ReactElement;
  onChange: (epicId: string | null) => void;
}

export function EpicMenu({ value, noneLabel, align = 'start', trigger, onChange }: EpicMenuProps) {
  const { filter, setFilter, options, loading, hasMore, loadMore } = useEpicOptions();
  return (
    <Menu.Root>
      <Menu.Trigger render={trigger} />
      <MenuPopupSurface align={align} className="w-72">
        <MenuFilterInput
          autoFocus
          value={filter}
          placeholder="Filter epics"
          onChange={(event) => {
            setFilter(event.target.value);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
        />
        <div className="max-h-72 overflow-y-auto">
          <Menu.RadioGroup
            value={value ?? NONE}
            onValueChange={(next: string) => {
              onChange(next === NONE ? null : next);
            }}
          >
            <MenuRadioOption value={NONE} icon={<TbX className="size-3.5" />}>
              {noneLabel}
            </MenuRadioOption>
            {options.map((epic) => {
              return (
                <MenuRadioOption
                  key={epic.id}
                  value={epic.id}
                  icon={<TbBolt className="size-3.5 text-accent-fg" />}
                >
                  <span className="font-mono text-mini text-fg-3">{epic.id}</span> {epic.title}
                </MenuRadioOption>
              );
            })}
          </Menu.RadioGroup>
          {loading && (
            <MutedHint>
              <Spinner />
              Loading epics
            </MutedHint>
          )}
          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              className="h-6 w-full cursor-pointer rounded-3 px-1.5 text-left text-xs text-primary-fg hover:bg-canvas-2"
            >
              Load more epics
            </button>
          )}
        </div>
      </MenuPopupSurface>
    </Menu.Root>
  );
}
