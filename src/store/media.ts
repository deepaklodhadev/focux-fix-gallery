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

export const useMediaStore = create<MediaStore>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,
  fetchMedia: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;

    set({ loading: true, error: null });
    try {
      // Step 1: Fetch the first 60 assets instantly (takes ~50-100ms)
      const firstPage = await mediaService.getAll(60);
      set({ items: firstPage, loaded: true, loading: false });

      // Step 2: Fetch all items in the background without blocking the UI
      mediaService.getAll().then((allItems) => {
        const currentItems = get().items;
        const capturedIds = new Set(
          currentItems.filter((i) => i.id.startsWith("captured_")).map((i) => i.id)
        );

        // Merge the background items with any locally captured mock items
        const capturedItems = currentItems.filter((i) => capturedIds.has(i.id));
        const merged = [...capturedItems, ...allItems.filter((i) => !capturedIds.has(i.id))];
        merged.sort((a, b) => b.creationTime - a.creationTime);

        set({ items: merged });
      }).catch((err) => {
        console.warn("Background media fetch failed:", err);
      });
    } catch (err: any) {
      set({ error: err?.message ?? "Failed to load media", loading: false });
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
