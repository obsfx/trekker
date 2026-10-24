import type { Tally } from '@/ui/lib/item-shapes.ts';

export interface TallyView {
  percent: number;
  label: string;
}

export abstract class Tallies {
  static view(tally: Tally | null): TallyView | null {
    if (tally === null) {
      return null;
    }
    return { percent: Tallies.percent(tally), label: Tallies.fraction(tally) };
  }

  static fraction(tally: Tally) {
    return `${String(tally.done)}/${String(tally.total)}`;
  }

  static percent(tally: Tally) {
    if (tally.total === 0) {
      return 0;
    }
    return (tally.done / tally.total) * 100;
  }
}
