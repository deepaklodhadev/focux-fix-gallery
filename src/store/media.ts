import { create } from "zustand";
import type { MediaItem } from "@/types";
import { mediaService } from "@/services";

interface MediaStore {
  items: MediaItem[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  offset: number;
  hasMore: boolean;
  fetchMedia: (force?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  removeItems: (ids: string[]) => void;
  addItems: (items: MediaItem[]) => void;
}

let activeFetchId = 0;

export const useMediaStore = create<MediaStore>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,
  offset: 0,
  hasMore: true,
  fetchMedia: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;

    set({ loading: true, error: null });
    const fetchId = ++activeFetchId;

    // Start background indexing of metadata cache
    if (mediaService.startBackgroundIndexing) {
      mediaService.startBackgroundIndexing();
    }

    try {
      const limit = 100;
      const firstPage = await mediaService.getAll(limit, 0);

      if (fetchId !== activeFetchId) return;
      set({
        items: firstPage,
        loaded: true,
        loading: false,
        offset: firstPage.length,
        hasMore: firstPage.length === limit,
      });
    } catch (err: any) {
      if (fetchId === activeFetchId) {
        set({ error: err?.message ?? "Failed to load media", loading: false });
      }
    }
  },
  loadMore: async () => {
    const { loading, hasMore, offset, items } = get();
    if (loading || !hasMore) return;

    set({ loading: true });
    const fetchId = activeFetchId;

    try {
      const limit = 100;
      const nextPage = await mediaService.getAll(limit, offset);

      if (fetchId !== activeFetchId) return;

      if (nextPage.length === 0) {
        set({ hasMore: false, loading: false });
        return;
      }

      const existingIds = new Set(items.map((i) => i.id));
      const newUniquePage = nextPage.filter((i) => !existingIds.has(i.id));

      if (newUniquePage.length === 0) {
        set({ hasMore: false, loading: false });
        return;
      }

      const merged = [...items, ...newUniquePage];
      merged.sort((a, b) => b.creationTime - a.creationTime);

      set({
        items: merged,
        loading: false,
        offset: offset + nextPage.length,
        hasMore: nextPage.length === limit,
      });
    } catch (err: any) {
      if (fetchId === activeFetchId) {
        set({ error: err?.message ?? "Failed to load more media", loading: false });
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
        offset: s.offset + newItems.filter((i) => !existing.has(i.id)).length,
      };
    });
  },
}));
