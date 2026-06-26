import type { GridSize } from "@/types";

/** Number of columns for a given grid-size preference. */
export function columnsFor(size: GridSize): number {
  switch (size) {
    case "small":
      return 5;
    case "large":
      return 3;
    case "medium":
    default:
      return 4;
  }
}

export const GRID_SIZE_LABELS: Record<GridSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};
