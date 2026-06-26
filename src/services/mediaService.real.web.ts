import type { MediaService } from "./mediaService";
import type { MediaItem } from "@/types";

export const realMediaService: MediaService = {
  isMock: false,
  async getAll(limit?: number, offset?: number): Promise<MediaItem[]> {
    console.warn("Real media library is not supported on the web platform.");
    return [];
  },
  async deletePermanent(ids: string[]): Promise<string[]> {
    console.warn("Real media library is not supported on the web platform.");
    return [];
  },
  async savePhoto(uri: string): Promise<{ id: string; uri: string }> {
    console.warn("Real media library is not supported on the web platform.");
    return { id: `web_${Date.now()}`, uri };
  },
};
