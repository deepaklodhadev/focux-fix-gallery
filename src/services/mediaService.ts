import type { Album, MediaItem } from "@/types";

/**
 * The single interface the UI talks to for media. Implementations:
 *  - mediaService.mock.ts  (bundled sample images; default for dev/preview)
 *  - mediaService.real.ts  (expo-media-library on a real device)
 *
 * Selection between them happens in ./index.ts based on EXPO_PUBLIC_USE_MOCK.
 */
export interface MediaService {
  /** True when running on bundled samples (so the UI can show a banner). */
  readonly isMock: boolean;

  /** All media, newest first. */
  getAll(limit?: number): Promise<MediaItem[]>;

  /**
   * Permanently remove the given items from the device library.
   * Returns the ids that were actually removed.
   */
  deletePermanent(ids: string[]): Promise<string[]>;

  /** Saves a local photo URI to the device gallery and returns the asset info. */
  savePhoto(uri: string): Promise<{ id: string; uri: string }>;
}

export interface AlbumService {
  /** Auto-detected folders as albums, sorted by count desc. Includes "All Photos". */
  getAutoAlbums(allItems: MediaItem[]): Album[];
}

/** Shared helper: group items by folder, newest first within each. */
export function groupByFolder(items: MediaItem[]): Map<string, MediaItem[]> {
  const map = new Map<string, MediaItem[]>();
  for (const it of items) {
    const arr = map.get(it.folder) ?? [];
    arr.push(it);
    map.set(it.folder, arr);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => b.creationTime - a.creationTime);
  }
  return map;
}
