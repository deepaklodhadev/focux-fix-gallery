import { create } from "zustand";
import type { MediaItem } from "@/types";
import { mediaService } from "@/services";

interface MediaStore {
  items: MediaItem[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchMedia: (force?: boolean) => Promise<void>;
  removeItems: (ids: string[]) => void;
  addItems: (items: MediaItem[]) => void;
}

let activeFetchId = 0;

export const useMediaStore = create<MediaStore>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,
  fetchMedia: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;

    set({ loading: true, error: null });
    const fetchId = ++activeFetchId;
    try {
      // Step 1: Fetch the first 60 assets instantly (takes ~50-100ms)
      const firstPage = await mediaService.getAll(60);
      
      if (fetchId !== activeFetchId) return;
      set({ items: firstPage, loaded: true, loading: false });

      // Step 2: Fetch remaining items in the background incrementally without blocking the UI
      (async () => {
        let offset = 60;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          if (fetchId !== activeFetchId) break;

          const nextPage = await mediaService.getAll(limit, offset);
          if (fetchId !== activeFetchId) break;

          if (nextPage.length === 0) {
            hasMore = false;
            break;
          }

          const currentItems = get().items;
          const capturedIds = new Set(
            currentItems.filter((i) => i.id.startsWith("captured_")).map((i) => i.id)
          );

          const capturedItems = currentItems.filter((i) => capturedIds.has(i.id));
          const otherCurrentItems = currentItems.filter((i) => !capturedIds.has(i.id));
          const existingIds = new Set(otherCurrentItems.map((i) => i.id));

          const newUniquePage = nextPage.filter((i) => !existingIds.has(i.id));
          if (newUniquePage.length === 0) {
            hasMore = false;
            break;
          }

          const merged = [...capturedItems, ...otherCurrentItems, ...newUniquePage];
          merged.sort((a, b) => b.creationTime - a.creationTime);

          set({ items: merged });
          offset += nextPage.length;
        }
      })().catch((err) => {
        console.warn("Background media fetch failed:", err);
      });
    } catch (err: any) {
      if (fetchId === activeFetchId) {
        set({ error: err?.message ?? "Failed to load media", loading: false });
      }
    }
  },
  removeItems: (ids) => {
    set((s) => ({
      items: s.items.filter((it) => !ids.includes(it.id)),
    }));
  },
  addItems: (newItems) => {
    set((s) => {
      const existing = new Set(s.items.map((i) => i.id));
      const merged = [...s.items, ...newItems.filter((i) => !existing.has(i.id))];
      return {
        items: merged.sort((a, b) => b.creationTime - a.creationTime),
      };
    });
  },
}));
