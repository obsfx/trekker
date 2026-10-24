import type { ReactNode } from 'react';
import { TbPlus, TbX } from 'react-icons/tb';
import { Link } from 'react-router';

import { TaskSearchMenu } from '@/ui/components/fields/task-search-menu.tsx';
import { useDependencyList } from '@/ui/hooks/use-dependency-list.ts';
import type { ItemRef } from '@/ui/lib/item-shapes.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { DocSectionHeading } from '@/ui/primitives/doc-section-heading.tsx';
import { IconButton } from '@/ui/primitives/icon-button.tsx';
import { LinkedItemRow } from '@/ui/primitives/linked-item-row.tsx';
import { MutedHint } from '@/ui/primitives/muted-hint.tsx';

interface DependencyListProps {
  icon: ReactNode;
  label: string;
  count?: string;
  refs: ItemRef[];
  excludeIds: readonly string[];
  emptyText: string;
  addLabel: string;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

export function DependencyList({
  icon,
  label,
  count,
  refs,
  excludeIds,
  emptyText,
  addLabel,
  onAdd,
  onRemove,
}: DependencyListProps) {
  const { rows, empty } = useDependencyList(refs);
  return (
    <div className="flex flex-col gap-0.5">
      <DocSectionHeading
        icon={icon}
        label={label}
        count={count}
        action={
          <TaskSearchMenu
            placeholder={addLabel}
            excludeIds={excludeIds}
            onPick={(hit) => {
              onAdd(hit.id);
            }}
            trigger={
              <Button variant="text" aria-label={addLabel}>
                <TbPlus className="size-3.5" />
                Link
              </Button>
            }
          />
        }
      />
      {empty && <MutedHint>{emptyText}</MutedHint>}
      {rows.map((ref) => {
        return (
          <LinkedItemRow
            key={ref.id}
            itemId={ref.id}
            status={ref.status}
            done={ref.done}
            title={
              <Link to={ref.href} className="hover:underline">
                {ref.title}
              </Link>
            }
            action={
              <IconButton
                aria-label={`Remove link to ${ref.id}`}
                className="size-5"
                onClick={() => {
                  onRemove(ref.id);
                }}
              >
                <TbX className="size-3" />
              </IconButton>
            }
          />
        );
      })}
    </div>
  );
}
