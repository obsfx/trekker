import type { LabeledOption } from '@/ui/lib/labeled-option.ts';
import type { ThemePreference } from '@/ui/lib/theme-preferences.ts';
import { usePreferencesStore } from '@/ui/store/preferences-store.ts';

const THEME_OPTIONS: LabeledOption<ThemePreference>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export const useThemeSetting = () => {
  const theme = usePreferencesStore((state) => {
    return state.theme;
  });
  const setTheme = usePreferencesStore((state) => {
    return state.setTheme;
  });
  return { theme, options: THEME_OPTIONS, setTheme };
};
