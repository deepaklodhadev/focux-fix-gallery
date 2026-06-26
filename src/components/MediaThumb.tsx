import React from "react";
import { Pressable, View, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";
import type { MediaItem } from "@/types";
import { formatDuration } from "@/utils/date";
import { useTheme } from "./ThemeProvider";
import { radii, spacing } from "@/theme/colors";

interface Props {
  item: MediaItem;
  size: number;
  height?: number;
  selected?: boolean;
  selectionMode?: boolean;
  onPress?: (item: MediaItem) => void;
  onLongPress?: (item: MediaItem) => void;
}

/** A single grid cell: image with video badge and optional selection ring. */
export const MediaThumb = React.memo(function MediaThumb({
  item,
  size,
  height,
  selected = false,
  selectionMode = false,
  onPress,
  onLongPress,
}: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onPress?.(item)}
      onLongPress={() => onLongPress?.(item)}
      style={[styles.cell, { width: size, height: height ?? size }]}
    >
      <Image
        source={item.uri}
        style={styles.image}
        contentFit="cover"
        transition={120}
        recyclingKey={item.id}
        cachePolicy="memory-disk"
      />
      {item.isVideo ? (
        <View style={styles.videoBadge} pointerEvents="none">
          <Text style={styles.videoBadgeText}>📹</Text>
        </View>
      ) : null}
      {selectionMode ? (
        <View
          style={[
            styles.check,
            { borderColor: "#fff", backgroundColor: selected ? theme.accent : "rgba(0,0,0,0.25)" },
          ]}
          pointerEvents="none"
        >
          {selected ? <Text style={styles.checkText}>✓</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
});

const GAP = 2;

const styles = StyleSheet.create({
  cell: {
    margin: GAP / 2,
    borderRadius: radii.sm,
    overflow: "hidden",
    backgroundColor: "#16171b",
  },
  image: { width: "100%", height: "100%" },
  videoBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  videoBadgeText: {
    color: "#fff",
    fontSize: 10,
  },
  check: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: "#fff", fontWeight: "700", fontSize: 13, lineHeight: 15 },
});
