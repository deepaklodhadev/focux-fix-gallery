import type { MediaItem } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A day bucket: header label + items newest-first within the day. */
export interface DayGroup {
  /** Start of the calendar day (local), used as a stable key. */
  key: string;
  /** Header label like "Today", "Yesterday", "12 June 2026". */
  label: string;
  /** Day start in epoch ms. */
  dayStart: number;
  items: MediaItem[];
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Formats a day start as "12 June 2026". */
export function formatDayLabel(dayStart: number): string {
  const d = new Date(dayStart);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function relativeLabel(dayStart: number): string | null {
  const d = new Date(dayStart);
  const today = new Date();
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((todayDate.getTime() - dDate.getTime()) / DAY_MS);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return null;
}

/**
 * Groups items into day buckets, newest day first, items newest-first within a
 * day. Input is assumed already sorted newest-first; we still sort defensively.
 */
export function groupByDay(items: MediaItem[]): DayGroup[] {
  const map = new Map<number, MediaItem[]>();
  for (const it of [...items].sort((a, b) => b.creationTime - a.creationTime)) {
    let time = it.creationTime;
    if (time < 10000000000) {
      time = time * 1000;
    }
    const ds = startOfDay(time);
    const arr = map.get(ds) ?? [];
    arr.push({ ...it, creationTime: time });
    map.set(ds, arr);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([dayStart, dayItems]) => {
      const rel = relativeLabel(dayStart);
      return {
        key: new Date(dayStart).toISOString().slice(0, 10),
        label: rel ?? formatDayLabel(dayStart),
        dayStart,
        items: dayItems,
      };
    });
}

/** Formats seconds as m:ss or h:mm:ss. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export { startOfDay };
