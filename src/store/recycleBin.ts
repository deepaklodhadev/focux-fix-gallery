import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MediaItem, RecycleItem } from "@/types";

interface RecycleBinStore {
  items: RecycleItem[];
  /** Move the given media items into the bin. */
  recycle: (toRecycle: MediaItem[]) => void;
  /** Restore items back out of the bin (returns restored item ids). */
  restore: (ids: string[]) => string[];
  /** Drop items from the bin (after permanent delete or expiry). */
  purge: (ids: string[]) => void;
  /** Remove everything older than retentionDays; returns purged ids. */
  purgeExpired: (retentionDays: number) => string[];
  /** Empty the entire bin. */
  empty: () => void;
}

export const useRecycleBinStore = create<RecycleBinStore>()(
  persist(
    (set) => ({
      items: [],
      recycle: (toRecycle) =>
        set((s) => {
          const now = Date.now();
          const existing = new Set(s.items.map((i) => i.id));
          const additions: RecycleItem[] = toRecycle
            .filter((m) => !existing.has(m.id))
            .map((item) => ({ id: item.id, item, deletedAt: now }));
          return { items: [...additions, ...s.items] };
        }),
      restore: (ids) => {
        const idset = new Set(ids);
        let restored: string[] = [];
        set((s) => {
          restored = s.items.filter((i) => idset.has(i.id)).map((i) => i.id);
          return { items: s.items.filter((i) => !idset.has(i.id)) };
        });
        return restored;
      },
      purge: (ids) =>
        set((s) => {
          const idset = new Set(ids);
          return { items: s.items.filter((i) => !idset.has(i.id)) };
        }),
      purgeExpired: (retentionDays) => {
        const cutoff = Date.now() - Math.max(1, retentionDays) * 24 * 60 * 60 * 1000;
        let purged: string[] = [];
        set((s) => {
          purged = s.items.filter((i) => i.deletedAt < cutoff).map((i) => i.id);
          return { items: s.items.filter((i) => i.deletedAt >= cutoff) };
        });
        return purged;
      },
      empty: () => set({ items: [] }),
    }),
    {
      name: "focuspix.recycleBin",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
