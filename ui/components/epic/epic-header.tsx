import { Menu } from '@base-ui/react/menu';
import { TbBolt, TbDots, TbPlus, TbTrash } from 'react-icons/tb';
import { Link } from 'react-router';

import { InlineDescription } from '@/ui/components/editing/inline-description.tsx';
import { InlineTitle } from '@/ui/components/editing/inline-title.tsx';
import { PriorityMenu } from '@/ui/components/editing/priority-menu.tsx';
import { StatusMenu } from '@/ui/components/editing/status-menu.tsx';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import type { EpicDetail } from '@/ui/lib/detail-shapes.ts';
import type { EpicPatch } from '@/ui/lib/gateways.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import type { StatusSegment } from '@/ui/lib/status-counts.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { CrumbBar } from '@/ui/primitives/crumb-bar.tsx';
import { CrumbSeparator } from '@/ui/primitives/crumb-separator.tsx';
import { IconButton } from '@/ui/primitives/icon-button.tsx';
import { MenuAction } from '@/ui/primitives/menu-action.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';
import { MetaText } from '@/ui/primitives/meta-text.tsx';
import { ProgressSplitBar } from '@/ui/primitives/progress-split-bar.tsx';

interface EpicHeaderProps {
  epic: EpicDetail;
  statuses: readonly ItemStatus[];
  summary: string;
  segments: readonly StatusSegment[];
  createdLabel: string;
  updatedLabel: string;
  updatedTitle: string;
  onUpdate: (patch: EpicPatch) => void;
  onAddTask: () => void;
  onDelete: () => void;
  actionsRef: (element: HTMLButtonElement | null) => void;
}

export function EpicHeader({
  epic,
  statuses,
  summary,
  segments,
  createdLabel,
  updatedLabel,
  updatedTitle,
  onUpdate,
  onAddTask,
  onDelete,
  actionsRef,
}: EpicHeaderProps) {
  return (
    <>
      <CrumbBar>
        <Link to={AppRoutes.board} className="hover:text-fg-1">
          Board
        </Link>
        <CrumbSeparator />
        <span className="font-mono text-fg-1">{epic.id}</span>
      </CrumbBar>
      <section className="flex shrink-0 flex-col gap-2.5 border-b border-line px-4 py-3">
        <div className="flex items-start gap-2">
          <TbBolt aria-label="Epic" className="mt-1 size-4 shrink-0 text-accent-fg" />
          <h1 className="min-w-0 flex-1">
            <InlineTitle
              value={epic.title}
              label="Epic title"
              onSave={(title) => {
                onUpdate({ title });
              }}
            />
          </h1>
          <Button variant="solid" onClick={onAddTask}>
            <TbPlus className="size-3.5" />
            Add task
          </Button>
          <Menu.Root>
            <Menu.Trigger render={<IconButton ref={actionsRef} aria-label="More actions" />}>
              <TbDots className="size-3.5" />
            </Menu.Trigger>
            <MenuPopupSurface align="end">
              <MenuAction icon={<TbTrash className="size-3.5" />} tone="danger" onClick={onDelete}>
                Delete epic
              </MenuAction>
            </MenuPopupSurface>
          </Menu.Root>
        </div>
        <div className="flex flex-wrap items-center gap-1 pl-5 text-xs">
          <StatusMenu
            value={epic.status}
            statuses={statuses}
            onChange={(status) => {
              onUpdate({ status });
            }}
          />
          <PriorityMenu
            value={epic.priority}
            onChange={(priority) => {
              onUpdate({ priority });
            }}
          />
          <span className="ml-auto flex items-center gap-3">
            <MetaText>Created {createdLabel}</MetaText>
            <MetaText title={updatedTitle}>Updated {updatedLabel}</MetaText>
          </span>
        </div>
        <div className="max-w-3xl pl-6">
          <InlineDescription
            value={epic.description}
            placeholder="Add a description"
            onSave={(description) => {
              onUpdate({ description });
            }}
          />
        </div>
        <div className="max-w-3xl pl-6">
          <ProgressSplitBar counts={epic.statusCounts} segments={segments} summary={summary} />
        </div>
      </section>
    </>
  );
}
