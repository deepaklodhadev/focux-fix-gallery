import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator, FlatList } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { runOnJS, useSharedValue, withTiming, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import { useTheme } from "@/components/ThemeProvider";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { useVaultStore } from "@/store/vault";
import { formatDuration } from "@/utils/date";
import type { MediaItem } from "@/types";
import { spacing } from "@/theme/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { visibleItems, allItems, loading } = useMediaLibrary();
  const ref = useRef<FlatList>(null);

  const isPrivate = useVaultStore((s) => s.privateIds.includes(id));
  const itemsList = useMemo(() => {
    if (isPrivate) {
      const privateIds = useVaultStore.getState().privateIds;
      return allItems.filter((i) => privateIds.includes(i.id));
    }
    return visibleItems;
  }, [isPrivate, visibleItems, allItems]);

  const baseIndex = useMemo(() => {
    if (!id) return -1;
    return itemsList.findIndex((i) => i.id === id);
  }, [itemsList, id]);

  const [index, setIndex] = useState(baseIndex >= 0 ? baseIndex : 0);
  const [prevBaseIndex, setPrevBaseIndex] = useState(baseIndex);

  if (baseIndex !== prevBaseIndex) {
    setIndex(baseIndex >= 0 ? baseIndex : 0);
    setPrevBaseIndex(baseIndex);
  }

  const [hidden, setHidden] = useState(false);

  const close = useCallback(() => {
    router.back();
  }, [router]);

  const translateY = useSharedValue(0);

  const dragGesture = Gesture.Pan()
    .activeOffsetY([10, 100]) // downward vertical gesture
    .failOffsetX([-15, 15])   // ignore horizontal swipes (handles FlatList scrolling)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 120 && e.velocityY > 0) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: withTiming(Math.max(0.4, 1 - translateY.value / 500), { duration: 100 }),
    };
  });

  const tapHeaderToggle = useCallback(() => setHidden((h) => !h), []);

  const onMomentumScrollEnd = useCallback((e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const activeIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (activeIndex >= 0 && activeIndex < itemsList.length) {
      setIndex(activeIndex);
    }
  }, [itemsList.length]);

  const getItemLayout = useCallback(
    (_data: any, idx: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * idx,
      index: idx,
    }),
    [],
  );

  const onScrollToIndexFailed = useCallback((info: { index: number; highestMeasuredFrameIndex: number }) => {
    setTimeout(() => {
      ref.current?.scrollToIndex({ index: info.index, animated: false });
    }, 50);
  }, []);

  const isSearching = loading || itemsList.length === 0 || !id;

  if (baseIndex === -1 && isSearching) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (baseIndex === -1) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textMuted }}>This photo is no longer available.</Text>
        <Pressable onPress={close}><Text style={{ color: theme.accent, marginTop: 12 }}>Go back</Text></Pressable>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <GestureDetector gesture={dragGesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <FlatList
            ref={ref}
            data={itemsList}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={baseIndex >= 0 ? baseIndex : 0}
            getItemLayout={getItemLayout}
            onScrollToIndexFailed={onScrollToIndexFailed}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index: itemIndex }) => (
              <View style={{ width: SCREEN_WIDTH, height: "100%", justifyContent: "center", alignItems: "center" }}>
                <Pressable style={StyleSheet.absoluteFill} onPress={tapHeaderToggle}>
                  {item.isVideo ? (
                    <VideoStage item={item} active={index === itemIndex} />
                  ) : (
                    <Image
                      source={item.uri}
                      style={StyleSheet.absoluteFill}
                      contentFit="contain"
                      transition={150}
                    />
                  )}
                </Pressable>
              </View>
            )}
            onMomentumScrollEnd={onMomentumScrollEnd}
            windowSize={3}
            maxToRenderPerBatch={2}
            initialNumToRender={2}
            removeClippedSubviews
          />

          {/* Header / counter, toggle on tap */}
          {!hidden && (
            <View style={[styles.chromeTop, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
              <Pressable onPress={close} hitSlop={12} style={styles.closeBtn}>
                <Text style={styles.closeGlyph}>✕</Text>
              </Pressable>
              <Text style={styles.counter}>
                {index + 1} / {itemsList.length}
              </Text>
              <View style={{ width: 32 }} />
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

function VideoStage({ item, active }: { item: MediaItem; active: boolean }) {
  if (!active) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <Image source={item.uri} style={StyleSheet.absoluteFill} contentFit="contain" />
        <View style={styles.videoBadge} pointerEvents="none">
          <Text style={styles.videoBadgeText}>VIDEO · {formatDuration(item.duration)}</Text>
        </View>
      </View>
    );
  }

  return <ActiveVideoPlayer item={item} />;
}

function ActiveVideoPlayer({ item }: { item: MediaItem }) {
  const player = useVideoPlayer(item.uri, (p) => {
    p.loop = true;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    return () => {
      player.pause();
    };
  }, [player]);

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
