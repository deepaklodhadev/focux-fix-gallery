import * as Sharing from "expo-sharing";
import { mediaService } from "@/services";
import type { MediaItem } from "@/types";
import { useSettingsStore } from "@/store/settings";
import { useRecycleBinStore } from "@/store/recycleBin";

export interface DeleteResult {
  /** Ids that were removed from view. */
  removed: string[];
  /** Whether they were moved to the recycle bin (vs permanently deleted). */
  recycled: boolean;
}

/**
 * Deletes the given items according to the user's delete-behavior preference.
 * Returns info so the UI can update its list and show a confirmation.
 */
export async function deleteItems(items: MediaItem[]): Promise<DeleteResult> {
  if (items.length === 0) return { removed: [], recycled: false };

  const settings = useSettingsStore.getState();
  const ids = items.map((i) => i.id);

  if (settings.deleteBehavior === "recycle") {
    useRecycleBinStore.getState().recycle(items);
    return { removed: ids, recycled: true };
  }

  // Permanent: ask the media service to delete (no-op in mock mode).
  await mediaService.deletePermanent(ids);
  return { removed: ids, recycled: false };
}

/** Shares one or more items via the OS share sheet. */
export async function shareItems(items: MediaItem[]): Promise<void> {
  if (items.length === 0) return;
  try {
    await Sharing.shareAsync(items[0].uri, {
      mimeType: items[0].isVideo ? "video/*" : "image/*",
      dialogTitle: "Share via Foco Gallery",
    });
  } catch {
    // Sharing can throw if unsupported/aborted — swallow.
  }
}
