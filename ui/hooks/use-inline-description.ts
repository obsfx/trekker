import { useInlineText } from '@/ui/hooks/use-inline-text.ts';
import { KeyChords } from '@/ui/lib/key-chords.ts';
import { TextQueries } from '@/ui/lib/text-queries.ts';

export const useInlineDescription = (
  value: string | null,
  onSave: (description: string | null) => void
) => {
  const text = useInlineText({
    value: value ?? '',
    required: false,
    submitWithModifier: true,
    onSave: (next) => {
      if (TextQueries.isBlank(next)) {
        onSave(null);
        return;
      }
      onSave(next);
    },
  });
  return { ...text, empty: TextQueries.isBlank(value), submitModifier: KeyChords.submitModifier() };
};
