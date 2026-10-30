import { Tooltip } from '@base-ui/react/tooltip';
import { clsx } from 'clsx';

import { useOverflowTooltip } from '@/ui/hooks/use-overflow-tooltip.ts';
import { TagChip } from '@/ui/primitives/tag-chip.tsx';
import { TooltipPopupSurface } from '@/ui/primitives/tooltip-popup-surface.tsx';

const MAX_VISIBLE_TAGS = 2;
const TOOLTIP_DELAY_MS = 200;

interface TagSummaryProps {
  tags: readonly string[];
  className?: string;
}

export function TagSummary({ tags, className }: TagSummaryProps) {
  const hiddenTags = tags.slice(MAX_VISIBLE_TAGS);
  const { attachTrigger, open, onOpenChange } = useOverflowTooltip(hiddenTags.length > 0);
  return (
    <span className={clsx('flex', className)}>
      <Tooltip.Root disableHoverablePopup open={open} onOpenChange={onOpenChange}>
        <Tooltip.Trigger
          delay={TOOLTIP_DELAY_MS}
          render={<span ref={attachTrigger} className="flex max-w-full min-w-0 gap-1" />}
        >
          {tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => {
            return (
              <TagChip key={tag} truncate>
                {tag}
              </TagChip>
            );
          })}
          {hiddenTags.length > 0 && (
            <TagChip>
              +{hiddenTags.length}
              <span className="sr-only">: {hiddenTags.join(', ')}</span>
            </TagChip>
          )}
        </Tooltip.Trigger>
        <TooltipPopupSurface>{tags.join(', ')}</TooltipPopupSurface>
      </Tooltip.Root>
    </span>
  );
}
