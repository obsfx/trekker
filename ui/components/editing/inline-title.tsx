import { useInlineText } from '@/ui/hooks/use-inline-text.ts';
import { EditableHeading } from '@/ui/primitives/editable-heading.tsx';
import { HeadingInput } from '@/ui/primitives/heading-input.tsx';

interface InlineTitleProps {
  value: string;
  label: string;
  onSave: (title: string) => void;
}

export function InlineTitle({ value, label, onSave }: InlineTitleProps) {
  const text = useInlineText({ value, required: true, submitWithModifier: false, onSave });
  if (text.editing) {
    return (
      <HeadingInput
        autoFocus
        aria-label={label}
        value={text.draft}
        onChange={(event) => {
          text.change(event.target.value);
        }}
        onBlur={text.commit}
        onKeyDown={text.onKeyDown}
      />
    );
  }
  return (
    <EditableHeading title="Click to edit" onClick={text.start}>
      {value}
    </EditableHeading>
  );
}
