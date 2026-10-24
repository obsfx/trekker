import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PreferencesPort } from '@/ui/lib/app-sync.ts';
import { PersistedState } from '@/ui/lib/persisted-state.ts';
import { PersistedViews } from '@/ui/lib/persisted-views.ts';
import type { ThemePreference } from '@/ui/lib/theme-preferences.ts';

interface PreferencesState {
  theme: ThemePreference;
  author: string;
  notifications: boolean;
  setTheme: (theme: ThemePreference) => void;
  setAuthor: (author: string) => void;
  setNotifications: (notifications: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => {
      return {
        theme: 'system',
        author: 'user',
        notifications: false,
        setTheme: (theme) => {
          set({ theme });
        },
        setAuthor: (author) => {
          set({ author });
        },
        setNotifications: (notifications) => {
          set({ notifications });
        },
      };
    },
    {
      name: 'trekker.preferences',
      storage: createJSONStorage(() => {
        return localStorage;
      }),
      partialize: ({ theme, author, notifications }) => {
        return { theme, author, notifications };
      },
      merge: PersistedState.merge<PreferencesState>(PersistedViews.preferences),
    }
  )
);

export const preferencesPort: PreferencesPort = {
  theme: {
    current: () => {
      return usePreferencesStore.getState().theme;
    },
    subscribe: (listener) => {
      return usePreferencesStore.subscribe((state, previous) => {
        if (state.theme !== previous.theme) {
          listener(state.theme);
        }
      });
    },
  },
  notificationsEnabled: () => {
    return usePreferencesStore.getState().notifications;
  },
};
