import { useEffect } from "react";
import { useMediaStore } from "@/store/media";
import { useSettingsStore } from "@/store/settings";
import { useVaultStore } from "@/store/vault";

/**
 * Exposes the media items filtered by the current settings (showVideos, hiddenFolders, privateIds).
 * The underlying items are managed globally in useMediaStore to avoid redundant fetches.
 */
export function useMediaLibrary() {
  const { items, loading, loaded, fetchMedia, removeItems, addItems } = useMediaStore();

  const showVideos = useSettingsStore((s) => s.showVideos);
  const hiddenFolders = useSettingsStore((s) => s.hiddenFolders);
  const privateIds = useVaultStore((s) => s.privateIds);

  useEffect(() => {
    if (!loaded && !loading) {
      fetchMedia();
    }
  }, [loaded, loading, fetchMedia]);

  const hiddenSet = new Set(hiddenFolders);
  const privateSet = new Set(privateIds);
  const visible = items.filter(
    (it) => (showVideos || !it.isVideo) && !hiddenSet.has(it.folder) && !privateSet.has(it.id),
  );

  return {
    allItems: items,
    visibleItems: visible,
    loading,
    reload: () => fetchMedia(true),
    removeItems,
    addItems,
  };
}
