import type { LabeledOption } from '@/ui/lib/labeled-option.ts';
import { Selections } from '@/ui/lib/selections.ts';

export const useCheckMenu = <T>(selected: readonly T[], options: readonly LabeledOption<T>[]) => {
  const summary = Selections.summary(selected, options);
  return { summary, active: summary !== null };
};
