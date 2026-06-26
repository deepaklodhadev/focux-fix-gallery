import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MediaItem } from "@/types";

interface MediaCacheState {
  cache: Record<string, MediaItem>;
  setCachedItems: (items: MediaItem[]) => void;
  clearCache: () => void;
}

export const useMediaCacheStore = create<MediaCacheState>()(
  persist(
    (set) => ({
      cache: {},
      setCachedItems: (items) =>
        set((state) => {
          const nextCache = { ...state.cache };
          for (const item of items) {
            nextCache[item.id] = item;
          }
          return { cache: nextCache };
        }),
      clearCache: () => set({ cache: {} }),
    }),
    {
      name: "focuspix.media-cache",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
