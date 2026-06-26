import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, SectionList, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/components/ThemeProvider";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { albumService } from "@/services";
import { useCustomAlbumsStore } from "@/store/customAlbums";
import type { Album } from "@/types";
import { radii, spacing } from "@/theme/colors";

export default function AlbumsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { visibleItems, loading } = useMediaLibrary();
  const customAlbums = useCustomAlbumsStore((s) => s.albums);

  const autoAlbums = useMemo(() => albumService.getAutoAlbums(visibleItems), [visibleItems]);

  const customAsAlbums: Album[] = useMemo(
    () =>
      customAlbums.map((c) => ({
        id: c.id,
        title: c.title,
        isAuto: false,
        count: c.itemIds.length,
        cover: visibleItems.find((i) => i.id === c.itemIds[0]),
      })),
    [customAlbums, visibleItems],
  );

  const sections = [
    { title: "Auto Albums", data: autoAlbums },
    ...(customAsAlbums.length ? [{ title: "Your Albums", data: customAsAlbums }] : []),
  ];

  const openAlbum = (album: Album) => {
    router.push({ pathname: "/album/[id]", params: { id: album.id } });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Albums"
        right={
          <Pressable
            onPress={() => router.push("/album/new")}
            style={[styles.addBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.addText, { color: theme.accentText }]}>+ New</Text>
          </Pressable>
        }
      />
      {visibleItems.length === 0 && !loading ? (
        <EmptyState title="No albums" message="Photos will appear here once available." />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionHeader, { color: theme.textMuted, backgroundColor: theme.bg }]}>
              {title}
            </Text>
          )}
          renderItem={({ item }) => (
            <AlbumRow album={item} onPress={() => openAlbum(item)} />
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </Screen>
  );
}

function AlbumRow({ album, onPress }: { album: Album; onPress: () => void }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const coverSize = 72;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? theme.surface : "transparent" }]}
    >
      <View style={[styles.cover, { width: coverSize, height: coverSize, backgroundColor: theme.surfaceMuted }]}>
        {album.cover ? (
          <Image source={album.cover.uri} style={{ width: coverSize, height: coverSize }} contentFit="cover" />
        ) : (
          <Text style={{ color: theme.textSubtle }}>—</Text>
        )}
      </View>
      <View style={styles.meta}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {album.title}
        </Text>
        <Text style={[styles.count, { color: theme.textMuted }]}>
          {album.count} {album.count === 1 ? "item" : "items"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md },
  addText: { fontSize: 14, fontWeight: "700" },
  sectionHeader: { fontSize: 13, fontWeight: "700", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  cover: { borderRadius: radii.md, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  meta: { marginLeft: spacing.md, flex: 1 },
  title: { fontSize: 16, fontWeight: "600" },
  count: { fontSize: 13, marginTop: 2 },
});
