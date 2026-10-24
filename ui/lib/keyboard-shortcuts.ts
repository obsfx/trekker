export abstract class KeyboardShortcuts {
  private static readonly editableTags = ['INPUT', 'TEXTAREA', 'SELECT'];

  static bind(key: string, onPress: () => void): () => void {
    const listener = (event: KeyboardEvent) => {
      if (event.key === key && !KeyboardShortcuts.isEditable(event.target)) {
        event.preventDefault();
        onPress();
      }
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }

  private static isEditable(target: EventTarget | null) {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable || KeyboardShortcuts.editableTags.includes(target.tagName))
    );
  }
}
