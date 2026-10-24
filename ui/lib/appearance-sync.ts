import type { ThemePreference } from '@/ui/lib/theme-preferences.ts';

export interface ThemeSource {
  current: () => ThemePreference;
  subscribe: (listener: (theme: ThemePreference) => void) => () => void;
}

export class AppearanceSync {
  private readonly source: ThemeSource;
  private readonly root: HTMLElement;

  constructor(source: ThemeSource, root: HTMLElement) {
    this.source = source;
    this.root = root;
  }

  start() {
    this.apply(this.source.current());
    return this.source.subscribe((theme) => {
      this.apply(theme);
    });
  }

  private apply(theme: ThemePreference) {
    if (theme === 'system') {
      delete this.root.dataset.theme;
      return;
    }
    this.root.dataset.theme = theme;
  }
}
