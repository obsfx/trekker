import { TbTag } from 'react-icons/tb';

import { useTagEditor } from '@/ui/hooks/use-tag-editor.ts';
import { RemovableTag } from '@/ui/primitives/removable-tag.tsx';

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagEditor({ tags, onChange }: TagEditorProps) {
  const editor = useTagEditor(tags, onChange);
  return (
    <span className="flex min-h-6 flex-wrap items-center gap-1">
      <TbTag aria-hidden="true" className="size-3.5 shrink-0 text-fg-3" />
      {tags.map((tag) => {
        return (
          <RemovableTag
            key={tag}
            tag={tag}
            onRemove={() => {
              editor.remove(tag);
            }}
          />
        );
      })}
      <input
        value={editor.draft}
        aria-label="Add tag"
        placeholder={tags.length === 0 ? 'Add tags' : 'Add'}
        onChange={(event) => {
          editor.setDraft(event.target.value);
        }}
        onKeyDown={editor.onKeyDown}
        onBlur={editor.add}
        className="h-5 w-16 min-w-0 rounded-2 bg-transparent px-1 text-xs text-fg outline-none placeholder:text-fg-4 focus:bg-canvas-1"
      />
    </span>
  );
}
