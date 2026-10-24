import { ThemePreferences } from '@/ui/lib/theme-preferences.ts';
import { usePreferencesStore } from '@/ui/store/preferences-store.ts';

export const useThemeToggle = () => {
  const theme = usePreferencesStore((state) => {
    return state.theme;
  });
  const setTheme = usePreferencesStore((state) => {
    return state.setTheme;
  });
  return {
    theme,
    label: ThemePreferences.label(theme),
    cycle: () => {
      setTheme(ThemePreferences.next(theme));
    },
  };
};
