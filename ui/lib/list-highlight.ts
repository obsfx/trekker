export abstract class ListHighlight {
  static step(key: string, highlight: number, count: number): number | null {
    if (key === 'ArrowDown') {
      return Math.min(highlight + 1, count - 1);
    }
    if (key === 'ArrowUp') {
      return Math.max(highlight - 1, 0);
    }
    return null;
  }
}
