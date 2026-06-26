import type { AlbumService } from "./mediaService";
import type { Album, MediaItem } from "@/types";

// Friendly display overrides for common auto-detected folders.
const DISPLAY: Record<string, string> = {
  Camera: "Camera",
  DCIM: "Camera",
  Screenshots: "Screenshots",
  "WhatsApp Images": "WhatsApp Images",
  Downloads: "Downloads",
};

function displayTitle(folder: string): string {
  return DISPLAY[folder] ?? folder;
}

export const albumService: AlbumService = {
  getAutoAlbums(allItems: MediaItem[]): Album[] {
    if (allItems.length === 0) return [];

    // Group by folder, newest first within each.
    const byFolder = new Map<string, MediaItem[]>();
    for (const it of allItems) {
      const arr = byFolder.get(it.folder) ?? [];
      arr.push(it);
      byFolder.set(it.folder, arr);
    }

    const folders = [...byFolder.entries()]
      .map(([folder, items]) => ({ folder, items }))
      .sort((a, b) => b.items.length - a.items.length || a.folder.localeCompare(b.folder));

    const albums: Album[] = folders.map(({ folder, items }) => ({
      id: `auto:${folder}`,
      title: displayTitle(folder),
      isAuto: true,
      count: items.length,
      cover: items[0], // newest in folder
    }));

    // Lead with an "All Photos" virtual album.
    return [
      { id: "auto:__all", title: "All Photos", isAuto: true, count: allItems.length, cover: allItems[0] },
      ...albums,
    ];
  },
};
