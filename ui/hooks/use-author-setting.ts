import { usePreferencesStore } from '@/ui/store/preferences-store.ts';

export const useAuthorSetting = () => {
  const author = usePreferencesStore((state) => {
    return state.author;
  });
  const setAuthor = usePreferencesStore((state) => {
    return state.setAuthor;
  });
  return {
    author,
    change: (value: string) => {
      const trimmed = value.trim();
      if (trimmed !== '') {
        setAuthor(trimmed);
      }
    },
  };
};
