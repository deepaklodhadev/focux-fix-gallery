import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/components/ThemeProvider";
import { useRecycleBinStore } from "@/store/recycleBin";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { useSelection } from "@/hooks/useSelection";
import { useSettingsStore } from "@/store/settings";
import { mediaService } from "@/services";
import { formatDuration } from "@/utils/date";
import { radii, spacing } from "@/theme/colors";
import type { RecycleItem } from "@/types";
import { CustomAlert, CustomAlertButton } from "@/components/CustomAlert";
import { SelectionBar } from "@/components/SelectionBar";

const DAY = 24 * 60 * 60 * 1000;

export default function RecycleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Stores
  const items = useRecycleBinStore((s) => s.items);
  const restore = useRecycleBinStore((s) => s.restore);
  const purge = useRecycleBinStore((s) => s.purge);
  const empty = useRecycleBinStore((s) => s.empty);
  const { addItems } = useMediaLibrary();
  const maxDays = useSettingsStore((s) => s.recycleRetentionDays);

  // States
  const sel = useSelection();
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: CustomAlertButton[];
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const showAlert = useCallback((title: string, message: string, buttons: CustomAlertButton[]) => {
    setAlert({ visible: true, title, message, buttons });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((a) => ({ ...a, visible: false }));
  }, []);

  // Columns & layout math
  const columns = 3;
  const cell = (width - (columns - 1) * 2) / columns;

  const executeRestore = useCallback(
    (ids: string[]) => {
      const restored = restore(ids);
      const restoredItems = items.filter((i) => restored.includes(i.id)).map((i) => i.item);
      addItems(restoredItems);
      sel.exit();
      showAlert("Restored", `${restored.length} item(s) restored successfully.`, [
        { text: "OK", onPress: hideAlert },
      ]);
    },
    [restore, items, addItems, sel, showAlert, hideAlert]
  );

  const executePurge = useCallback(
    async (ids: string[]) => {
      setBusy(true);
      try {
        await mediaService.deletePermanent(ids);
        purge(ids);
        sel.exit();
        showAlert("Permanently Deleted", `${ids.length} item(s) permanently deleted.`, [
          { text: "OK", onPress: hideAlert },
        ]);
      } catch (err: any) {
        showAlert("Error", err?.message ?? "Failed to delete items permanently.", [
          { text: "OK", onPress: hideAlert },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [purge, sel, showAlert, hideAlert]
  );

  const handleRestoreAll = useCallback(() => {
    const ids = items.map((i) => i.id);
    executeRestore(ids);
  }, [items, executeRestore]);

  const handleEmpty = useCallback(() => {
    showAlert(
      "Empty Recycle Bin?",
      "All items in the Recycle Bin will be permanently deleted from your device. This action is irreversible.",
      [
        { text: "Cancel", onPress: hideAlert, style: "cancel" },
        {
          text: "Empty Bin",
          style: "destructive",
          onPress: async () => {
            hideAlert();
            setBusy(true);
            try {
              const ids = items.map((i) => i.id);
              await mediaService.deletePermanent(ids);
              empty();
              showAlert("Success", "Recycle bin emptied.", [{ text: "OK", onPress: hideAlert }]);
            } catch (err: any) {
              showAlert("Error", err?.message ?? "Failed to empty Recycle Bin.", [
                { text: "OK", onPress: hideAlert },
              ]);
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }, [items, empty, showAlert, hideAlert]);

  const handleItemPress = useCallback(
    (ri: RecycleItem) => {
      if (sel.mode) {
        sel.toggle(ri.id);
        return;
      }

      showAlert(
        "Manage Recycled Item",
        "Would you like to restore this item or delete it permanently from your device?",
        [
          { text: "Cancel", onPress: hideAlert, style: "cancel" },
          {
            text: "Delete Permanently",
            style: "destructive",
            onPress: () => {
              hideAlert();
              executePurge([ri.id]);
            },
          },
          {
            text: "Restore",
            onPress: () => {
              hideAlert();
              executeRestore([ri.id]);
            },
          },
        ]
      );
    },
    [sel, executeRestore, executePurge, showAlert, hideAlert]
  );

  const handleItemLongPress = useCallback(
    (ri: RecycleItem) => {
      if (!sel.mode) {
        sel.enter(ri.id);
      }
    },
    [sel]
  );

  const handleRestoreSelected = useCallback(() => {
    executeRestore(Array.from(sel.selected));
  }, [sel.selected, executeRestore]);

  const handleConfirmDeleteSelected = useCallback(() => {
    showAlert(
      "Delete permanently?",
      `Are you sure you want to permanently delete the ${sel.selected.size} selected item(s)? This action is irreversible.`,
      [
        { text: "Cancel", onPress: hideAlert, style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: () => {
            hideAlert();
            executePurge(Array.from(sel.selected));
          },
        },
      ]
    );
  }, [sel.selected, showAlert, hideAlert, executePurge]);

  const selectedItems = useMemo(
    () => items.filter((i) => sel.selected.has(i.id)),
    [items, sel.selected]
  );

  const subtitle = useMemo(() => {
    if (items.length === 0) return "Empty";
    const oldest = Math.min(...items.map((i) => i.deletedAt));
    const daysLeft = Math.ceil((oldest + maxDays * DAY - Date.now()) / DAY);
    return `${items.length} item${items.length === 1 ? "" : "s"} · auto-deleted in ~${Math.max(
      0,
      daysLeft
    )}d`;
  }, [items, maxDays]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Mathematical Perfectly Centered Header Layout */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={[styles.navBtn, { color: theme.accent }]}>‹ Settings</Text>
          </Pressable>
        </View>

        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            Recycle Bin
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {items.length > 0 && !sel.mode ? (
            <Pressable onPress={handleRestoreAll} hitSlop={8} style={{ marginRight: spacing.sm }}>
              <Text style={[styles.navBtn, { color: theme.accent }]}>All</Text>
            </Pressable>
          ) : null}
          {items.length > 0 && !sel.mode ? (
            <Pressable onPress={handleEmpty} hitSlop={8}>
              <Text style={[styles.navBtn, { color: theme.danger }]}>Empty</Text>
            </Pressable>
          ) : null}
          {items.length === 0 && <View style={{ width: 10 }} />}
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: "center" }}>
            Your Recycle Bin is empty.
          </Text>
          <Text style={{ color: theme.textSubtle, fontSize: 12, marginTop: 4, textAlign: "center" }}>
            Deleted items will be stored here for up to {maxDays} days before being auto-purged.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={columns}
          contentContainerStyle={{ padding: 1, paddingBottom: 120 }}
          renderItem={({ item: ri }) => (
            <RecycleGridItem
              item={ri}
              size={cell}
              selected={sel.selected.has(ri.id)}
              selectionMode={sel.mode}
              onPress={handleItemPress}
              onLongPress={handleItemLongPress}
              maxDays={maxDays}
            />
          )}
        />
      )}

      {sel.mode ? (
        <SelectionBar
          count={sel.selected.size}
          onClose={sel.exit}
          actions={[
            { label: "Restore", onPress: handleRestoreSelected, disabled: selectedItems.length === 0 },
            { label: "Delete", onPress: handleConfirmDeleteSelected, destructive: true, disabled: busy },
          ]}
        />
      ) : null}

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
      />
    </View>
  );
}

// --- Recycle Grid Cell Subcomponent ---------------------------------------
const RecycleGridItem = React.memo(function RecycleGridItem({
  item,
  size,
  selected,
  selectionMode,
  onPress,
  onLongPress,
  maxDays,
}: {
  item: RecycleItem;
  size: number;
  selected: boolean;
  selectionMode: boolean;
  onPress: (item: RecycleItem) => void;
  onLongPress: (item: RecycleItem) => void;
  maxDays: number;
}) {
  const theme = useTheme();

  const daysLeft = useMemo(() => {
    const diff = Math.ceil((item.deletedAt + maxDays * DAY - Date.now()) / DAY);
    return Math.max(1, diff);
  }, [item.deletedAt, maxDays]);

  return (
    <Pressable
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      style={[styles.cell, { width: size - 2, height: size - 2 }]}
    >
      <Image
        source={item.item.uri}
        style={styles.image}
        contentFit="cover"
        transition={120}
      />
      {/* Days remaining badge on top-left */}
      <View style={styles.daysBadge} pointerEvents="none">
        <Text style={styles.daysBadgeText}>{daysLeft}d left</Text>
      </View>

      {/* Video length duration badge on bottom-right */}
      {item.item.isVideo ? (
        <View style={styles.videoBadge} pointerEvents="none">
          <Text style={[styles.playArrow, { color: theme.accent }]}>▶</Text>
          <Text style={styles.videoDuration}>{formatDuration(item.item.duration)}</Text>
        </View>
      ) : null}

      {/* Checkbox overlay in select mode */}
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

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 56,
  },
  headerLeft: {
    width: 85,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    width: 85,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  navBtn: {
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  cell: {
    margin: 1,
    position: "relative",
    borderRadius: radii.sm,
    overflow: "hidden",
    backgroundColor: "#16171b",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  daysBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  daysBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  videoBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  playArrow: {
    fontSize: 9,
    lineHeight: 11,
  },
  videoDuration: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
    lineHeight: 13,
  },
});
