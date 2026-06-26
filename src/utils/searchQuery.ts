import type { ParsedSearch } from "@/types";
import { startOfDay } from "./date";

const DAY = 24 * 60 * 60 * 1000;

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const MONTH_ABBR = MONTH_NAMES.map((m) => m.slice(0, 3));

/** Parses a search string into a date range or free-text query. */
export function parseSearch(raw: string): ParsedSearch {
  const query = raw.trim();
  if (!query) return { type: "none", raw };

  const lower = query.toLowerCase();

  // "today" / "yesterday"
  if (lower === "today") {
    const start = startOfDay(Date.now());
    return { type: "date", start, end: start + DAY, raw };
  }
  if (lower === "yesterday") {
    const start = startOfDay(Date.now() - DAY);
    return { type: "date", start, end: start + DAY, raw };
  }

  // "last week" / "last month" → last N days ending now.
  if (lower === "last week") {
    return { type: "date", start: Date.now() - 7 * DAY, end: Date.now(), raw };
  }
  if (lower === "last month") {
    return { type: "date", start: Date.now() - 30 * DAY, end: Date.now(), raw };
  }

  // "<Month> <Year>" e.g. "June 2026", "jun 2026".
  const monthYear = lower.match(/^([a-z]{3,9})\s+(\d{4})$/);
  if (monthYear) {
    const mi = monthIndex(monthYear[1]);
    if (mi >= 0) {
      const year = Number(monthYear[2]);
      const start = new Date(year, mi, 1).getTime();
      const end = new Date(year, mi + 1, 1).getTime();
      return { type: "date", start, end, raw };
    }
  }

  // "<Month>" alone → that month in the current year.
  if (MONTH_NAMES.includes(lower) || MONTH_ABBR.includes(lower)) {
    const mi = monthIndex(lower);
    if (mi >= 0) {
      const year = new Date().getFullYear();
      const start = new Date(year, mi, 1).getTime();
      const end = new Date(year, mi + 1, 1).getTime();
      return { type: "date", start, end, raw };
    }
  }

  // "<Year>" alone.
  const yearOnly = lower.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = Number(yearOnly[1]);
    return {
      type: "date",
      start: new Date(year, 0, 1).getTime(),
      end: new Date(year + 1, 0, 1).getTime(),
      raw,
    };
  }

  // Otherwise treat as free text (album/folder name match).
  return { type: "text", text: lower, raw };
}

function monthIndex(token: string): number {
  const full = MONTH_NAMES.indexOf(token);
  if (full >= 0) return full;
  const abbr = MONTH_ABBR.indexOf(token);
  return abbr;
}

/** Filters media items by a parsed search. */
export function applySearch(
  items: import("@/types").MediaItem[],
  parsed: ParsedSearch,
): import("@/types").MediaItem[] {
  if (parsed.type === "none") return [];
  if (parsed.type === "date") {
    const { start, end } = parsed;
    return items.filter((it) => it.creationTime >= (start ?? 0) && it.creationTime < (end ?? Infinity));
  }
  const q = parsed.text ?? "";
  return items.filter((it) => it.folder.toLowerCase().includes(q));
}
