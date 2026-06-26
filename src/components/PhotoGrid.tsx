import React, { useMemo, useState, useRef, useCallback } from "react";
import { FlatList, StyleSheet, View, PanResponder } from "react-native";
import type { MediaItem } from "@/types";
import { DaySection } from "./DaySection";
import { EmptyState } from "./EmptyState";
import { groupByDay } from "@/utils/date";
import { useTheme } from "./ThemeProvider";
import { spacing, radii } from "@/theme/colors";

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
 * Includes a custom, highly tactile fast-scrollbar handle on the right side.
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

  // Layout & Scroll Tracking States
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const initialScrollY = useRef(0);
  const scrollTimeout = useRef<any>(null);

  // Scrollbar dimensions
  const trackHeight = containerHeight - 40;
  const handleHeight = 60;

  const scrollableRange = contentHeight - containerHeight;
  const trackRange = trackHeight - handleHeight;

  // Calculate handle position on track
  const handleTop = useMemo(() => {
    if (scrollableRange <= 0 || trackRange <= 0) return 0;
    const percentage = scrollY / scrollableRange;
    return Math.max(0, Math.min(trackRange, percentage * trackRange));
  }, [scrollY, scrollableRange, trackRange]);

  const handleScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    setScrollY(y);
    setIsScrolling(true);

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        if (scrollableRange <= 0 || trackRange <= 0) return;

        const touchY = evt.nativeEvent.locationY;
        const targetHandleTop = touchY - handleHeight / 2;
        const percentage = Math.max(0, Math.min(1, targetHandleTop / trackRange));
        const targetOffset = percentage * scrollableRange;

        flatListRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
        setScrollY(targetOffset);
        initialScrollY.current = targetOffset;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (scrollableRange <= 0 || trackRange <= 0) return;

        // Map mouse/finger coordinate drag delta to scroll position
        const delta = (gestureState.dy / trackRange) * scrollableRange;
        const targetOffset = Math.max(0, Math.min(scrollableRange, initialScrollY.current + delta));

        flatListRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
        setScrollY(targetOffset);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  const showScrollbar = contentHeight > containerHeight && containerHeight > 0;

  if (items.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {ListHeaderComponent}
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <FlatList
        ref={flatListRef}
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={(w, h) => setContentHeight(h)}
        onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
      />

      {showScrollbar && (
        <View
          style={[styles.scrollbarTrack, { height: trackHeight }]}
          {...panResponder.panHandlers}
        >
          <View
            style={[
              styles.scrollbarHandle,
              {
                height: handleHeight,
                top: handleTop,
                backgroundColor: isDragging ? theme.accent : theme.textSubtle,
                opacity: isDragging || isScrolling ? 0.75 : 0.3,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollbarTrack: {
    position: "absolute",
    right: 2,
    top: 20,
    width: 24, // Wide hit area for easy grabbing
    justifyContent: "flex-start",
    zIndex: 999,
  },
  scrollbarHandle: {
    width: 6, // Thin and elegant visual appearance
    borderRadius: radii.full,
    alignSelf: "center",
  },
});
