interface ChordNativeEvent {
  isComposing: boolean;
}

interface ChordEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  nativeEvent: ChordNativeEvent;
}

export abstract class KeyChords {
  static submitModifier() {
    if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)) {
      return 'Cmd';
    }
    return 'Ctrl';
  }

  static isSubmit(event: ChordEvent) {
    return event.key === 'Enter' && (event.metaKey || event.ctrlKey);
  }

  static isPlainEnter(event: ChordEvent) {
    return (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.nativeEvent.isComposing
    );
  }

  static isEscape(event: ChordEvent) {
    return event.key === 'Escape';
  }
}
