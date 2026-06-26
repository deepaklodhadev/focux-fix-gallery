import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable, TextInput } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "@/components/Screen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { SelectionBar } from "@/components/SelectionBar";
import { useTheme } from "@/components/ThemeProvider";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { useSelection } from "@/hooks/useSelection";
import { columnsFor } from "@/utils/grid";
import { useSettingsStore } from "@/store/settings";
import { deleteItems, shareItems } from "@/utils/mediaActions";
import { mediaService } from "@/services";
import { parseSearch, applySearch } from "@/utils/searchQuery";
import { radii, spacing } from "@/theme/colors";

export default function TimelineScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { visibleItems, loading, reload, removeItems, addItems } = useMediaLibrary();
  const gridSize = useSettingsStore((s) => s.gridSize);
  const columns = useMemo(() => columnsFor(gridSize), [gridSize]);

  const [query, setQuery] = useState("");

  const sel = useSelection();
  const [busy, setBusy] = useState(false);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return visibleItems;
    const parsed = parseSearch(query);
    return applySearch(visibleItems, parsed);
  }, [query, visibleItems]);

  const handlePress = useCallback(
    (item: { id: string }) => {
      if (sel.mode) {
        sel.toggle(item.id);
        return;
      }
      router.push({ pathname: "/viewer/[id]", params: { id: item.id } });
    },
    [sel, router],
  );

  const handleLongPress = useCallback(
    (item: { id: string }) => {
      if (!sel.mode) sel.enter(item.id);
    },
    [sel],
  );

  const selectedItems = useMemo(
    () => filteredItems.filter((i) => sel.selected.has(i.id)),
    [filteredItems, sel.selected],
  );

  const doDelete = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setBusy(true);
    try {
      const result = await deleteItems(selectedItems);
      removeItems(result.removed);
      Alert.alert(
        result.recycled ? "Moved to Recycle Bin" : "Deleted",
        result.recycled
          ? `${result.removed.length} item(s) moved to Recycle Bin.`
          : `${result.removed.length} item(s) deleted permanently.`,
      );
    } catch (err: any) {
      console.error("Deletion failed:", err);
      Alert.alert("Error", err?.message ?? "Failed to delete selected items.");
    } finally {
      sel.exit();
      setBusy(false);
    }
  }, [selectedItems, removeItems, sel]);

  const doShare = useCallback(async () => {
    if (selectedItems.length === 0) return;
    await shareItems(selectedItems);
    sel.exit();
  }, [selectedItems, sel]);

  const handleCameraPress = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera permission is needed to take photos.");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let savedAssetId = `captured_${Date.now()}`;
        let savedAssetUri = asset.uri;

        try {
          const savedAsset = await mediaService.savePhoto(asset.uri);
          savedAssetId = savedAsset.id;
          savedAssetUri = savedAsset.uri;
        } catch (e) {
          console.warn("Could not save to native media library, using local URI:", e);
        }

        const newItem = {
          id: savedAssetId,
          uri: savedAssetUri,
          isVideo: false,
          duration: 0,
          creationTime: Date.now(),
          modificationTime: Date.now(),
          folder: "Camera",
          width: asset.width ?? 1200,
          height: asset.height ?? 800,
        };
        addItems([newItem]);
        Alert.alert("Photo Captured", "Captured photo is added to your Timeline!");
      }
    } catch (err: any) {
      console.error("Failed to launch camera:", err);
      Alert.alert("Error", "Could not launch camera.");
    }
  };

  return (
    <Screen>
      {/* Clean Timeline Header with only "Timeline" text */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.accent }]}>Timeline</Text>
      </View>

      {/* Integrated search bar at the top of the Timeline */}
      <View style={[styles.searchWrap, { backgroundColor: theme.surface }]}>
        <Text style={[styles.glyph, { color: theme.textSubtle }]}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder='Try "June 2026", "WhatsApp", "Videos"'
          placeholderTextColor={theme.textSubtle}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery("")} hitSlop={12}>
            <Text style={[styles.glyph, { color: theme.textSubtle }]}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <PhotoGrid
        items={filteredItems}
        columns={columns}
        selectedIds={sel.selected}
        selectionMode={sel.mode}
        onPress={handlePress}
        onLongPress={handleLongPress}
        emptyTitle={query ? "No matches" : "No photos"}
        emptyMessage={
          query
            ? `Nothing matched "${query}".`
            : mediaService.isMock
            ? "Run npm run gen:samples"
            : "Grant photo access to see your library."
        }
      />

      {/* Floating Action Button containing only '+' */}
      {!sel.mode && (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: theme.accent,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
          onPress={handleCameraPress}
        >
          <Text style={[styles.fabText, { color: theme.accentText }]}>+</Text>
        </Pressable>
      )}

      {sel.mode ? (
        <SelectionBar
          count={sel.selected.size}
          onClose={sel.exit}
          actions={[
            { label: "Share", onPress: doShare, disabled: selectedItems.length === 0 },
            { label: "Delete", onPress: doDelete, destructive: true, disabled: busy },
          ]}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    height: 56,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    height: 40,
  },
  glyph: { fontSize: 18, width: 24, textAlign: "center" },
  input: { flex: 1, fontSize: 15, paddingHorizontal: spacing.xs, paddingVertical: 4 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "600",
  },
});
