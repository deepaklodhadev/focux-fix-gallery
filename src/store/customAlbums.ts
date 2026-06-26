import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomAlbumRecord } from "@/types";
import { makeId } from "@/utils/id";

interface CustomAlbumsStore {
  albums: CustomAlbumRecord[];
  createAlbum: (title: string, itemIds?: string[]) => string;
  renameAlbum: (id: string, title: string) => void;
  deleteAlbum: (id: string) => void;
  addItems: (id: string, itemIds: string[]) => void;
  removeItems: (id: string, itemIds: string[]) => void;
}

export const useCustomAlbumsStore = create<CustomAlbumsStore>()(
  persist(
    (set) => ({
      albums: [],
      createAlbum: (title, itemIds = []) => {
        const id = makeId("cust:");
        set((s) => ({
          albums: [
            { id, title: title.trim() || "Untitled", itemIds: [...itemIds], createdAt: Date.now() },
            ...s.albums,
          ],
        }));
        return id;
      },
      renameAlbum: (id, title) =>
        set((s) => ({
          albums: s.albums.map((a) => (a.id === id ? { ...a, title: title.trim() || a.title } : a)),
        })),
      deleteAlbum: (id) => set((s) => ({ albums: s.albums.filter((a) => a.id !== id) })),
      addItems: (id, itemIds) =>
        set((s) => ({
          albums: s.albums.map((a) => {
            if (a.id !== id) return a;
            const set = new Set(a.itemIds);
            for (const it of itemIds) set.add(it);
            return { ...a, itemIds: [...set] };
          }),
        })),
      removeItems: (id, itemIds) =>
        set((s) => ({
          albums: s.albums.map((a) =>
            a.id === id ? { ...a, itemIds: a.itemIds.filter((x) => !itemIds.includes(x)) } : a,
          ),
        })),
    }),
    {
      name: "focuspix.customAlbums",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
