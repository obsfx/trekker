export abstract class TagLists {
  static add(tags: readonly string[], raw: string): string[] {
    const additions = raw
      .split(',')
      .map((tag) => {
        return tag.trim();
      })
      .filter((tag) => {
        return tag !== '';
      });
    const next = [...tags];
    for (const tag of additions) {
      if (!next.includes(tag)) {
        next.push(tag);
      }
    }
    return next;
  }

  static remove(tags: readonly string[], tag: string): string[] {
    return tags.filter((entry) => {
      return entry !== tag;
    });
  }

  static same(left: readonly string[], right: readonly string[]) {
    return (
      left.length === right.length &&
      left.every((tag, index) => {
        return right[index] === tag;
      })
    );
  }
}
