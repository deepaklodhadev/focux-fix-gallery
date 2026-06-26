import type { MediaService } from "./mediaService";
import type { MediaItem } from "@/types";

// SDK 56's expo-media-library is resolved dynamically to prevent loading errors
// on platforms or client builds where the native module is missing (e.g. Expo Go / Web).

function folderFromUri(uri: string): string {
  try {
    const path = uri.replace(/^file:\/\//, "");
    const segs = path.split("/").filter(Boolean);
    if (segs.length >= 2) return segs[segs.length - 2];
    return "Camera";
  } catch {
    return "Camera";
  }
}

async function fromAsset(asset: any, MediaLibrary: any): Promise<MediaItem> {
  const [uri, mediaType, creationTime, modificationTime, width, height, duration] = await Promise.all([
    asset.getUri().catch(() => ""),
    asset.getMediaType().catch(() => MediaLibrary.MediaType.IMAGE),
    asset.getCreationTime().catch(() => Date.now()),
    asset.getModificationTime().catch(() => Date.now()),
    asset.getWidth().catch(() => 0),
    asset.getHeight().catch(() => 0),
    asset.getDuration().catch(() => null),
  ]);

  const normCreation = creationTime ? (creationTime < 10000000000 ? creationTime * 1000 : creationTime) : Date.now();
  const normMod = modificationTime ? (modificationTime < 10000000000 ? modificationTime * 1000 : modificationTime) : normCreation;

  return {
    id: asset.id,
    uri,
    folder: folderFromUri(uri),
    width: width ?? 0,
    height: height ?? 0,
    creationTime: normCreation,
    modificationTime: normMod,
    isVideo: mediaType === MediaLibrary.MediaType.VIDEO,
    duration: duration != null ? Math.round(duration / 1000) : 0, // API returns ms
  };
}

export const realMediaService: MediaService = {
  isMock: false,

  async getAll(limit?: number): Promise<MediaItem[]> {
    try {
      const MediaLibrary = await import("expo-media-library");
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) return [];

      let query = new MediaLibrary.Query()
        .orderBy({ key: MediaLibrary.AssetField.CREATION_TIME, ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const assets = await query.exe();

      // Resolve metadata concurrently; drop any that fail.
      const settled = await Promise.allSettled(assets.map((asset) => fromAsset(asset, MediaLibrary)));
      const items = settled
        .filter((r): r is PromiseFulfilledResult<MediaItem> => r.status === "fulfilled")
        .map((r) => r.value);
      // Defensive sort (API should already return newest-first).
      items.sort((a, b) => b.creationTime - a.creationTime);
      return items;
    } catch (err) {
      console.warn("expo-media-library native module is not available:", err);
      return [];
    }
  },

  async deletePermanent(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    try {
      const MediaLibrary = await import("expo-media-library");
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) return [];

      const assets = ids.map((id) => new MediaLibrary.Asset(id));
      await MediaLibrary.Asset.delete(assets);
      return ids;
    } catch (err) {
      console.warn("Could not delete from native media library:", err);
      return [];
    }
  },

  async savePhoto(uri: string): Promise<{ id: string; uri: string }> {
    try {
      const MediaLibrary = await import("expo-media-library");
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        throw new Error("Media Library permissions not granted.");
      }
      const savedAsset = await MediaLibrary.createAssetAsync(uri);
      return { id: savedAsset.id, uri: savedAsset.uri };
    } catch (err) {
      console.warn("Could not save to native media library:", err);
      // Fall back to local URI in case native library is mock/missing
      return { id: `fallback_${Date.now()}`, uri };
    }
  },
};
