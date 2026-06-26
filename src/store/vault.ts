import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface VaultState {
  privateIds: string[];
  passcode: string | null;
  setPasscode: (code: string | null) => void;
  lockItems: (ids: string[]) => void;
  unlockItems: (ids: string[]) => void;
  purgeItems: (ids: string[]) => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      privateIds: [],
      passcode: null,
      setPasscode: (code) => set({ passcode: code }),
      lockItems: (ids) =>
        set((s) => {
          const next = new Set([...s.privateIds, ...ids]);
          return { privateIds: Array.from(next) };
        }),
      unlockItems: (ids) =>
        set((s) => ({
          privateIds: s.privateIds.filter((id) => !ids.includes(id)),
        })),
      purgeItems: (ids) =>
        set((s) => ({
          privateIds: s.privateIds.filter((id) => !ids.includes(id)),
        })),
    }),
    {
      name: "foco.vault",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
