import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MAX_RECENT = 12;

interface RecentSearchesStore {
  searches: string[];
  add: (query: string) => void;
  clear: () => void;
}

export const useRecentSearchesStore = create<RecentSearchesStore>()(
  persist(
    (set) => ({
      searches: [],
      add: (query) => {
        const q = query.trim();
        if (!q) return;
        set((s) => ({
          // De-dupe, cap length, newest first.
          searches: [q, ...s.searches.filter((x) => x !== q)].slice(0, MAX_RECENT),
        }));
      },
      clear: () => set({ searches: [] }),
    }),
    {
      name: "foco.recentSearches",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
