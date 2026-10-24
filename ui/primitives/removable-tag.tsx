import { TbX } from 'react-icons/tb';

import { TagChip } from '@/ui/primitives/tag-chip.tsx';

interface RemovableTagProps {
  tag: string;
  onRemove: () => void;
}

export function RemovableTag({ tag, onRemove }: RemovableTagProps) {
  return (
    <TagChip>
      {tag}
      <button
        type="button"
        aria-label={`Remove tag ${tag}`}
        onClick={onRemove}
        className="-mr-0.5 ml-0.5 flex size-3.5 cursor-pointer items-center justify-center rounded-1 text-fg-4 hover:bg-canvas-4 hover:text-fg-1"
      >
        <TbX className="size-2.5" />
      </button>
    </TagChip>
  );
}
