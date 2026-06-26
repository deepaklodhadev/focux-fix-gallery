import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { runOnJS, useSharedValue, withTiming, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import { useTheme } from "@/components/ThemeProvider";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { formatDuration } from "@/utils/date";
import type { MediaItem } from "@/types";
import { spacing } from "@/theme/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { visibleItems, loading } = useMediaLibrary();

  const baseIndex = useMemo(() => {
    if (!id) return -1;
    return visibleItems.findIndex((i) => i.id === id);
  }, [visibleItems, id]);

  const [index, setIndex] = useState(baseIndex);
  const [prevBaseIndex, setPrevBaseIndex] = useState(baseIndex);

  if (baseIndex !== prevBaseIndex) {
    setIndex(baseIndex);
    setPrevBaseIndex(baseIndex);
  }

  const item = index >= 0 ? visibleItems[index] : null;

  // Horizontal swipe (next/prev) via translateX shared value.
  const translateX = useSharedValue(0);
  // Vertical swipe-down to close.
  const translateY = useSharedValue(0);
  const [hidden, setHidden] = useState(false);

  const goIndex = useCallback(
    (next: number) => {
      if (next < 0 || next >= visibleItems.length) return;
      setIndex(next);
    },
    [visibleItems.length],
  );

  const close = useCallback(() => router.back(), [router]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      // If the gesture is mostly vertical, treat as a close-drag.
      if (Math.abs(e.translationY) > Math.abs(e.translationX)) {
        translateY.value = e.translationY;
        translateX.value = 0;
      } else {
        translateX.value = e.translationY === 0 ? e.translationX : 0;
        translateY.value = 0;
      }
    })
    .onEnd((e) => {
      const dx = e.translationX;
      const dy = e.translationY;
      if (Math.abs(dy) > Math.abs(dx) && dy > 120) {
        // Swipe down → close.
        runOnJS(close)();
        translateY.value = 0;
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SCREEN_WIDTH * 0.25) {
        if (dx < 0) runOnJS(goIndex)(index + 1);
        else runOnJS(goIndex)(index - 1);
      }
      translateY.value = withSpring(0);
      translateX.value = withSpring(0);
    });

  const imageAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  const tapHeaderToggle = useCallback(() => setHidden((h) => !h), []);

  const isSearching = loading || visibleItems.length === 0 || !id;

  if (!item && isSearching) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textMuted }}>This photo is no longer available.</Text>
        <Pressable onPress={close}><Text style={{ color: theme.accent, marginTop: 12 }}>Go back</Text></Pressable>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={{ flex: 1 }}>
          <Pressable style={styles.stage} onPress={tapHeaderToggle}>
            {item.isVideo ? (
              <VideoStage item={item} />
            ) : (
              <Animated.View style={[{ flex: 1, width: "100%" }, imageAnimStyle]}>
                <Image
                  source={item.uri}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                  transition={150}
                />
              </Animated.View>
            )}
          </Pressable>

          {/* Header / counter, toggle on tap */}
          {!hidden ? (
            <View style={[styles.chromeTop, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
              <Pressable onPress={close} hitSlop={12} style={styles.closeBtn}>
                <Text style={styles.closeGlyph}>✕</Text>
              </Pressable>
              <Text style={styles.counter}>
                {index + 1} / {visibleItems.length}
              </Text>
              <View style={{ width: 32 }} />
            </View>
          ) : null}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

function VideoStage({ item }: { item: MediaItem }) {
  const player = useVideoPlayer(item.uri, (p) => {
    p.loop = true;
    p.muted = false;
  });
  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView player={player} contentFit="contain" style={StyleSheet.absoluteFill} nativeControls />
      <View style={styles.videoBadge} pointerEvents="none">
        <Text style={styles.videoBadgeText}>VIDEO · {formatDuration(item.duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  chromeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  closeGlyph: { color: "#fff", fontSize: 14, fontWeight: "700" },
  counter: { color: "#fff", fontSize: 14, fontWeight: "700", textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 4 },
  videoBadge: { position: "absolute", bottom: 24, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  videoBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
});
