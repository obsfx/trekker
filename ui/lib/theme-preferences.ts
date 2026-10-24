import * as v from 'valibot';

const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export abstract class ThemePreferences {
  static readonly schema = v.picklist(THEME_PREFERENCES);

  private static readonly order: readonly ThemePreference[] = THEME_PREFERENCES;

  private static readonly labels: Record<ThemePreference, string> = {
    system: 'System theme',
    light: 'Light theme',
    dark: 'Dark theme',
  };

  static next(preference: ThemePreference): ThemePreference {
    const index = ThemePreferences.order.indexOf(preference);
    return ThemePreferences.order[(index + 1) % ThemePreferences.order.length] ?? 'system';
  }

  static label(preference: ThemePreference) {
    return ThemePreferences.labels[preference];
  }
}
