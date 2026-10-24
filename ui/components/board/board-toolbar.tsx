import { Menu } from '@base-ui/react/menu';
import { TbArchive, TbBolt, TbChevronDown, TbSortDescending, TbStack2 } from 'react-icons/tb';

import { EpicMenu } from '@/ui/components/pickers/epic-menu.tsx';
import { ConfirmPopover } from '@/ui/components/shared/confirm-popover.tsx';
import { useBoardToolbar } from '@/ui/hooks/use-board-toolbar.ts';
import type { BoardKind } from '@/ui/lib/board.ts';
import { ItemQueries, type SortField } from '@/ui/lib/item-queries.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { MenuLabel } from '@/ui/primitives/menu-label.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';
import { MenuRadioOption } from '@/ui/primitives/menu-radio-option.tsx';

export function BoardToolbar() {
  const {
    view,
    kindOptions,
    sortFields,
    sortLabel,
    kindLabel,
    setKind,
    setEpicId,
    setSortField,
    confirmingArchive,
    setConfirmingArchive,
    archive,
  } = useBoardToolbar();
  return (
    <>
      <Menu.Root>
        <Menu.Trigger render={<Button variant={view.kind === 'all' ? 'text' : 'subtle'} />}>
          <TbStack2 className="size-3.5" />
          {kindLabel}
          <TbChevronDown className="size-3" />
        </Menu.Trigger>
        <MenuPopupSurface align="start">
          <MenuLabel>Show</MenuLabel>
          <Menu.RadioGroup
            value={view.kind}
            onValueChange={(kind: BoardKind) => {
              setKind(kind);
            }}
          >
            {kindOptions.map((option) => {
              return (
                <MenuRadioOption key={option.value} value={option.value}>
                  {option.label}
                </MenuRadioOption>
              );
            })}
          </Menu.RadioGroup>
        </MenuPopupSurface>
      </Menu.Root>
      <EpicMenu
        value={view.epicId}
        noneLabel="All epics"
        onChange={setEpicId}
        trigger={
          <Button variant={view.epicId ? 'subtle' : 'text'}>
            <TbBolt className="size-3.5" />
            {view.epicId ?? 'Epic'}
            <TbChevronDown className="size-3" />
          </Button>
        }
      />
      <Menu.Root>
        <Menu.Trigger render={<Button variant="text" />}>
          <TbSortDescending className="size-3.5" />
          {sortLabel}
          <TbChevronDown className="size-3" />
        </Menu.Trigger>
        <MenuPopupSurface align="start">
          <MenuLabel>Order cards by</MenuLabel>
          <Menu.RadioGroup
            value={view.sort.field}
            onValueChange={(field: SortField) => {
              setSortField(field);
            }}
          >
            {sortFields.map((field) => {
              return (
                <MenuRadioOption key={field} value={field}>
                  {ItemQueries.sortLabel(field)}
                </MenuRadioOption>
              );
            })}
          </Menu.RadioGroup>
        </MenuPopupSurface>
      </Menu.Root>
      <ConfirmPopover
        open={confirmingArchive}
        title="Archive completed items?"
        description="Every completed task and epic moves to Archived. They stay searchable and you can change their status back."
        confirmLabel="Archive"
        trigger={
          <Button variant="text" className="ml-auto">
            <TbArchive className="size-3.5" />
            Archive completed
          </Button>
        }
        onConfirm={archive}
        onOpenChange={setConfirmingArchive}
      />
    </>
  );
}
