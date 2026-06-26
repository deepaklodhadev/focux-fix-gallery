import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Settings, GridSize, DeleteBehavior, ThemePref } from "@/types";

interface SettingsStore extends Settings {
  setGridSize: (s: GridSize) => void;
  setShowVideos: (v: boolean) => void;
  setHiddenFolders: (folders: string[]) => void;
  toggleHiddenFolder: (folder: string) => void;
  setDeleteBehavior: (b: DeleteBehavior) => void;
  setRecycleRetentionDays: (d: number) => void;
  setTheme: (t: ThemePref) => void;
}

const DEFAULTS: Settings = {
  gridSize: "medium",
  showVideos: true,
  hiddenFolders: [],
  deleteBehavior: "recycle",
  recycleRetentionDays: 30,
  theme: "system",
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setGridSize: (gridSize) => set({ gridSize }),
      setShowVideos: (showVideos) => set({ showVideos }),
      setHiddenFolders: (hiddenFolders) => set({ hiddenFolders }),
      toggleHiddenFolder: (folder) =>
        set((s) => ({
          hiddenFolders: s.hiddenFolders.includes(folder)
            ? s.hiddenFolders.filter((f) => f !== folder)
            : [...s.hiddenFolders, folder],
        })),
      setDeleteBehavior: (deleteBehavior) => set({ deleteBehavior }),
      setRecycleRetentionDays: (recycleRetentionDays) =>
        set({ recycleRetentionDays: Math.max(1, Math.floor(recycleRetentionDays)) }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "foco.settings",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
