import { TbPencil } from 'react-icons/tb';

import { useInlineDescription } from '@/ui/hooks/use-inline-description.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { IconButton } from '@/ui/primitives/icon-button.tsx';
import { MarkdownView } from '@/ui/primitives/markdown-view.tsx';
import { SubmitHint } from '@/ui/primitives/submit-hint.tsx';
import { TextAreaField } from '@/ui/primitives/text-area-field.tsx';

interface InlineDescriptionProps {
  value: string | null;
  placeholder: string;
  contentClassName?: string;
  onSave: (description: string | null) => void;
}

export function InlineDescription({
  value,
  placeholder,
  contentClassName,
  onSave,
}: InlineDescriptionProps) {
  const text = useInlineDescription(value, onSave);
  if (text.editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <TextAreaField
          autoFocus
          mono
          rows={10}
          aria-label="Description"
          value={text.draft}
          placeholder="Markdown supported"
          onChange={(event) => {
            text.change(event.target.value);
          }}
          onKeyDown={text.onKeyDown}
        />
        <div className="flex items-center justify-end gap-1">
          <SubmitHint modifier={text.submitModifier} action="to save" className="mr-auto" />
          <Button variant="text" onClick={text.cancel}>
            Cancel
          </Button>
          <Button variant="solid" onClick={text.commit}>
            Save
          </Button>
        </div>
      </div>
    );
  }
  if (text.empty || value === null) {
    return (
      <button
        type="button"
        onClick={text.start}
        className="-mx-1.5 cursor-text rounded-3 px-1.5 py-1 text-left text-xs text-fg-4 outline-none hover:bg-canvas-1 focus-visible:focus-ring"
      >
        {placeholder}
      </button>
    );
  }
  return (
    <div className="group relative">
      <IconButton
        aria-label="Edit description"
        onClick={text.start}
        className="absolute top-0 right-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <TbPencil className="size-3.5" />
      </IconButton>
      <div className={contentClassName}>
        <MarkdownView source={value} />
      </div>
    </div>
  );
}
