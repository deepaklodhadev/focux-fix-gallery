import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import type { MediaItem } from "@/types";
import type { DayGroup } from "@/utils/date";
import { MediaThumb } from "./MediaThumb";
import { useTheme } from "./ThemeProvider";
import { spacing } from "@/theme/colors";

interface Props {
  group: DayGroup;
  columns: number;
  groupIndex?: number;
  selectedIds: Set<string>;
  selectionMode: boolean;
  onPress: (item: MediaItem) => void;
  onLongPress: (item: MediaItem) => void;
}

/** Renders a day header + its photo grid. */
export function DaySection({
  group,
  columns,
  groupIndex,
  selectedIds,
  selectionMode,
  onPress,
  onLongPress,
}: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const padding = spacing.sm * 2;
  const availableWidth = width - padding;

  const isDynamic = groupIndex !== undefined;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: theme.text }]}>{group.label}</Text>
        <Text style={[styles.itemsCount, { color: theme.textSubtle }]}>
          {group.items.length} {group.items.length === 1 ? "item" : "items"}
        </Text>
      </View>
      <View style={styles.grid}>
        {group.items.map((item, idx) => {
          let itemSize = 0;
          let itemHeight: number | undefined = undefined;

          if (isDynamic) {
            if (groupIndex === 0) {
              // Today section layout:
              // Index 0: 2/3 width, Index 1: 1/3 width, Row height = availableWidth * 0.5
              // Others: 1/3 width, square
              if (idx === 0) {
                itemSize = Math.floor((availableWidth * 2) / 3) - 2;
                itemHeight = Math.floor(availableWidth * 0.48);
              } else if (idx === 1) {
                itemSize = Math.floor(availableWidth / 3) - 2;
                itemHeight = Math.floor(availableWidth * 0.48);
              } else {
                itemSize = Math.floor(availableWidth / 3) - 2;
              }
            } else if (groupIndex === 1) {
              // Yesterday section layout: 2 columns split
              itemSize = Math.floor(availableWidth / 2) - 2;
            } else {
              // August 12 and onwards: 4 columns split
              itemSize = Math.floor(availableWidth / 4) - 2;
            }
          } else {
            // Standard layout fallback (for albums, search, etc.)
            itemSize = Math.floor(availableWidth / columns) - 2;
          }

          return (
            <MediaThumb
              key={item.id}
              item={item}
              size={itemSize}
              height={itemHeight}
              selected={selectedIds.has(item.id)}
              selectionMode={selectionMode}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    marginBottom: 8,
  },
  header: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  itemsCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
});
