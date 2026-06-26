import { useEffect } from "react";
import { useMediaStore } from "@/store/media";
import { useSettingsStore } from "@/store/settings";

/**
 * Exposes the media items filtered by the current settings (showVideos, hiddenFolders).
 * The underlying items are managed globally in useMediaStore to avoid redundant fetches.
 */
export function useMediaLibrary() {
  const { items, loading, loaded, fetchMedia, removeItems, addItems } = useMediaStore();

  const showVideos = useSettingsStore((s) => s.showVideos);
  const hiddenFolders = useSettingsStore((s) => s.hiddenFolders);

  useEffect(() => {
    if (!loaded && !loading) {
      fetchMedia();
    }
  }, [loaded, loading, fetchMedia]);

  const hiddenSet = new Set(hiddenFolders);
  const visible = items.filter(
    (it) => (showVideos || !it.isVideo) && !hiddenSet.has(it.folder),
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
