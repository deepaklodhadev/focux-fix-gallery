import type { MediaService } from "./mediaService";
import type { MediaItem } from "@/types";
import { useMediaCacheStore } from "@/store/mediaCache";

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
  const info = await asset.getInfo();
  const uri = info.uri || "";
  const normCreation = info.creationTime ? (info.creationTime < 10000000000 ? info.creationTime * 1000 : info.creationTime) : Date.now();
  const normMod = info.modificationTime ? (info.modificationTime < 10000000000 ? info.modificationTime * 1000 : info.modificationTime) : normCreation;

  return {
    id: asset.id || info.id,
    uri,
    folder: folderFromUri(uri),
    width: info.width ?? 0,
    height: info.height ?? 0,
    creationTime: normCreation,
    modificationTime: normMod,
    isVideo: info.mediaType === MediaLibrary.MediaType.VIDEO,
    duration: info.duration != null ? Math.round(info.duration / 1000) : 0, // API returns ms
  };
}

let isIndexing = false;

export const realMediaService: MediaService = {
  isMock: false,

  async getAll(limit?: number, offset?: number): Promise<MediaItem[]> {
    try {
      const MediaLibrary = await import("expo-media-library");
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) return [];

      let query = new MediaLibrary.Query()
        .orderBy({ key: MediaLibrary.AssetField.CREATION_TIME, ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }
      if (offset !== undefined) {
        query = query.offset(offset);
      }

      const assets = await query.exe();
      const cacheStore = useMediaCacheStore.getState();
      const cache = cacheStore.cache;

      const items: MediaItem[] = [];
      const unresolvedAssets: any[] = [];
      const assetIndices: number[] = [];

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const cached = cache[asset.id];
        if (cached) {
          items.push(cached);
        } else {
          unresolvedAssets.push(asset);
          assetIndices.push(i);
          // Temporary slot placeholder
          (items as any).push(null);
        }
      }

      if (unresolvedAssets.length > 0) {
        const settled = await Promise.allSettled(
          unresolvedAssets.map((asset) => fromAsset(asset, MediaLibrary))
        );

        const newItems: MediaItem[] = [];
        for (let i = 0; i < settled.length; i++) {
          const res = settled[i];
          const slotIndex = assetIndices[i];
          if (res.status === "fulfilled") {
            items[slotIndex] = res.value;
            newItems.push(res.value);
          } else {
            (items as any)[slotIndex] = null;
          }
        }

        if (newItems.length > 0) {
          cacheStore.setCachedItems(newItems);
        }
      }

      const filteredItems = items.filter(Boolean) as MediaItem[];
      filteredItems.sort((a, b) => b.creationTime - a.creationTime);
      return filteredItems;
    } catch (err) {
      console.warn("expo-media-library native module is not available:", err);
      return [];
    }
  },

  startBackgroundIndexing() {
    if (isIndexing) return;
    isIndexing = true;

    (async () => {
      try {
        const MediaLibrary = await import("expo-media-library");
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (!perm.granted) {
          isIndexing = false;
          return;
        }

        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          // Low-priority worker: wait 400ms between pages to not starve UI thread
          await new Promise((resolve) => setTimeout(resolve, 400));

          const query = new MediaLibrary.Query()
            .orderBy({ key: MediaLibrary.AssetField.CREATION_TIME, ascending: false })
            .limit(limit)
            .offset(offset);

          const assets = await query.exe();
          if (assets.length === 0) {
            hasMore = false;
            break;
          }

          const cacheStore = useMediaCacheStore.getState();
          const cache = cacheStore.cache;
          const unresolved = assets.filter((a: any) => !cache[a.id]);

          if (unresolved.length > 0) {
            const settled = await Promise.allSettled(
              unresolved.map((asset: any) => fromAsset(asset, MediaLibrary))
            );
            const resolvedItems = settled
              .filter((r): r is PromiseFulfilledResult<MediaItem> => r.status === "fulfilled")
              .map((r) => r.value);

            if (resolvedItems.length > 0) {
              cacheStore.setCachedItems(resolvedItems);
            }
          }

          offset += assets.length;
        }
      } catch (err) {
        console.warn("Background indexing failed:", err);
      } finally {
        isIndexing = false;
      }
    })();
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
