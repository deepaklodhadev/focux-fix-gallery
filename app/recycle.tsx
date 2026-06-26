import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Alert, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/components/ThemeProvider";
import { useRecycleBinStore } from "@/store/recycleBin";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { mediaService } from "@/services";
import { formatDayLabel, formatDuration } from "@/utils/date";
import { radii, spacing } from "@/theme/colors";
import type { RecycleItem } from "@/types";

const DAY = 24 * 60 * 60 * 1000;

export default function RecycleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useRecycleBinStore((s) => s.items);
  const restore = useRecycleBinStore((s) => s.restore);
  const purge = useRecycleBinStore((s) => s.purge);
  const empty = useRecycleBinStore((s) => s.empty);
  const { addItems } = useMediaLibrary();
  const { width } = useWindowDimensions();

  const columns = 3;
  const cell = (width - 2 * (columns - 1)) / columns;

  const handleRestore = (ri: RecycleItem) => {
    restore([ri.id]);
    addItems([ri.item]);
    Alert.alert("Restored", `"${ri.item.id}" returned to your library.`);
  };

  const handleRestoreAll = () => {
    const restored = restore(items.map((i) => i.id));
    addItems(items.filter((i) => restored.includes(i.id)).map((i) => i.item));
    Alert.alert("Restored", `${restored.length} item(s) restored.`);
  };

  const handleEmpty = () => {
    Alert.alert("Empty Recycle Bin?", "Items will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Empty", style: "destructive", onPress: () => empty() },
    ]);
  };

  const handleDeleteOne = (ri: RecycleItem) => {
    Alert.alert("Delete permanently?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await mediaService.deletePermanent([ri.id]);
            purge([ri.id]);
          } catch (err: any) {
            Alert.alert("Error", err?.message ?? "Failed to delete item permanently.");
          }
        },
      },
    ]);
  };

  const subtitle = useMemo(() => {
    if (items.length === 0) return "Empty";
    const oldest = Math.min(...items.map((i) => i.deletedAt));
    const daysLeft = Math.ceil((oldest + 30 * DAY - Date.now()) / DAY);
    return `${items.length} item(s) · auto-deleted in ~${Math.max(0, daysLeft)}d`;
  }, [items]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.navBtn, { color: theme.textMuted }]}>‹ Back</Text>
        </Pressable>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Recycle Bin</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
        </View>
        {items.length > 0 ? (
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Pressable onPress={handleRestoreAll} hitSlop={8}>
              <Text style={[styles.navBtn, { color: theme.accent }]}>Restore all</Text>
            </Pressable>
            <Pressable onPress={handleEmpty} hitSlop={8}>
              <Text style={[styles.navBtn, { color: theme.danger }]}>Empty</Text>
            </Pressable>
          </View>
        ) : <View style={{ width: 40 }} />}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: theme.textMuted, fontSize: 15 }}>Nothing here. Deleted items will land in the bin.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={columns}
          contentContainerStyle={{ padding: 1, paddingBottom: 80 }}
          renderItem={({ item: ri }) => (
            <View style={{ margin: 1 }}>
              <Image source={ri.item.uri} style={{ width: cell, height: cell, borderRadius: radii.sm }} contentFit="cover" />
              {ri.item.isVideo ? (
                <View style={styles.badge}><Text style={styles.badgeText}>▶ {formatDuration(ri.item.duration)}</Text></View>
              ) : null}
              <View style={styles.actions}>
                <Pressable onPress={() => handleRestore(ri)} style={[styles.mini, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.miniText, { color: theme.accentText }]}>Restore</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteOne(ri)} style={[styles.mini, { backgroundColor: theme.danger }]}>
                  <Text style={[styles.miniText, { color: "#fff" }]}>Delete</Text>
                </Pressable>
              </View>
              <Text style={styles.dayLabel}>{formatDayLabel(ri.item.creationTime)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  navBtn: { fontSize: 15, fontWeight: "600" },
  title: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 12, textAlign: "center", marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  badge: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  actions: { position: "absolute", left: 4, right: 4, bottom: 4, flexDirection: "row", gap: 4 },
  mini: { flex: 1, paddingVertical: 3, borderRadius: 4, alignItems: "center" },
  miniText: { fontSize: 9, fontWeight: "700" },
  dayLabel: { color: "rgba(255,255,255,0.9)", fontSize: 9, fontWeight: "600", position: "absolute", top: 4, left: 4, textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 3 },
});
