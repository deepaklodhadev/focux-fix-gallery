import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import type { MediaItem } from "@/types";
import { DaySection } from "./DaySection";
import { EmptyState } from "./EmptyState";
import { groupByDay } from "@/utils/date";
import { useTheme } from "./ThemeProvider";

interface Props {
  items: MediaItem[];
  columns: number;
  selectedIds: Set<string>;
  selectionMode: boolean;
  onPress: (item: MediaItem) => void;
  onLongPress: (item: MediaItem) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  ListHeaderComponent?: React.ReactElement | null;
}

/**
 * Day-grouped photo grid, reused by Timeline, Album detail, and Search.
 * Items are grouped into day sections and virtualized per-section.
 */
export function PhotoGrid({
  items,
  columns,
  selectedIds,
  selectionMode,
  onPress,
  onLongPress,
  emptyTitle,
  emptyMessage,
  ListHeaderComponent,
}: Props) {
  const theme = useTheme();
  const groups = useMemo(() => groupByDay(items), [items]);

  if (items.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {ListHeaderComponent}
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </View>
    );
  }

  return (
    <FlatList
      data={groups}
      keyExtractor={(g) => g.key}
      renderItem={({ item: g, index }) => (
        <DaySection
          group={g}
          columns={columns}
          groupIndex={index}
          selectedIds={selectedIds}
          selectionMode={selectionMode}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      )}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={{ paddingBottom: 40, backgroundColor: theme.bg }}
      initialNumToRender={6}
      windowSize={9}
      removeClippedSubviews
    />
  );
}
