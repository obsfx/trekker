import type { LabeledOption } from '@/ui/lib/labeled-option.ts';

export abstract class Selections {
  static toggle<T>(selected: readonly T[], value: T): T[] {
    if (selected.includes(value)) {
      return selected.filter((entry) => {
        return entry !== value;
      });
    }
    return [...selected, value];
  }

  static summary<T>(selected: readonly T[], options: readonly LabeledOption<T>[]) {
    if (selected.length === 0) {
      return null;
    }
    if (selected.length === 1) {
      const option = options.find((entry) => {
        return entry.value === selected[0];
      });
      return option?.label ?? null;
    }
    return String(selected.length);
  }
}
