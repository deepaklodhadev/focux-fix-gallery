import type { MediaService } from "./mediaService";
import { realMediaService } from "./mediaService.real";

/** The active media service — UI code imports this and nothing else. */
export const mediaService: MediaService = realMediaService;

export { albumService } from "./albums";
export { groupByFolder } from "./mediaService";
export type { MediaService, AlbumService } from "./mediaService";
