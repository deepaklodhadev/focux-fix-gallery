// Core domain types for FocusPix.

/** A single photo or video, normalized from either the mock or real media layer. */
export interface MediaItem {
  /** Stable id (expo-media-library id or mock id). */
  id: string;
  /** URI usable by <Image source={uri}> / expo-image. */
  uri: string;
  /** Source folder / album name as it exists on disk, e.g. "Camera". */
  folder: string;
  /** Pixel width. */
  width: number;
  /** Pixel height. */
  height: number;
  /** Creation time, epoch ms. */
  creationTime: number;
  /** Modification time, epoch ms. */
  modificationTime: number;
  /** True for videos. */
  isVideo: boolean;
  /** Video duration in seconds (0 for photos). */
  duration: number;
}

/** An album shown on the Albums tab. */
export interface Album {
  /** Auto albums use a stable slug; custom albums use a generated id. */
  id: string;
  /** Display name, e.g. "Camera", "WhatsApp Images", "My Trip". */
  title: string;
  /** True for folders detected automatically; false for user-created albums. */
  isAuto: boolean;
  /** Number of items currently in the album. */
  count: number;
  /** Cover item (used to render the album thumbnail). */
  cover?: MediaItem;
}

/** Grid size preference. */
export type GridSize = "small" | "medium" | "large";

/** Where deleted items go. */
export type DeleteBehavior = "recycle" | "permanent";

/** App color theme. */
export type ThemePref = "light" | "dark" | "system";

/** Persisted user settings. */
export interface Settings {
  gridSize: GridSize;
  showVideos: boolean;
  /** Folder names excluded from Timeline/Albums. */
  hiddenFolders: string[];
  deleteBehavior: DeleteBehavior;
  /** Days before recycled items are purged. */
  recycleRetentionDays: number;
  theme: ThemePref;
}

/** An item held in the recycle bin. */
export interface RecycleItem {
  /** Same id as the original media item. */
  id: string;
  /** Snapshot of the media at delete time. */
  item: MediaItem;
  /** When it was moved to the bin, epoch ms. */
  deletedAt: number;
}

/** A user-created album record. */
export interface CustomAlbumRecord {
  id: string;
  title: string;
  /** Ordered list of media item ids. */
  itemIds: string[];
  createdAt: number;
}

/** A parsed search query — either a date range or a free-text match. */
export interface ParsedSearch {
  type: "date" | "text" | "none";
  /** Inclusive start (epoch ms) for date searches. */
  start?: number;
  /** Exclusive end (epoch ms) for date searches. */
  end?: number;
  /** Lowercased text for text searches. */
  text?: string;
  /** Original query string. */
  raw: string;
}
