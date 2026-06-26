import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { SelectionBar } from "@/components/SelectionBar";
import { useTheme } from "@/components/ThemeProvider";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { useSelection } from "@/hooks/useSelection";
import { useVaultStore } from "@/store/vault";
import { useCustomAlbumsStore } from "@/store/customAlbums";
import { columnsFor } from "@/utils/grid";
import { useSettingsStore } from "@/store/settings";
import { deleteItems, shareItems } from "@/utils/mediaActions";
import type { MediaItem } from "@/types";
import { radii, spacing } from "@/theme/colors";
import { CustomAlert, CustomAlertButton } from "@/components/CustomAlert";

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { visibleItems, removeItems } = useMediaLibrary();
  const columns = columnsFor(useSettingsStore((s) => s.gridSize));
  const customAlbums = useCustomAlbumsStore((s) => s.albums);
  const deleteAlbum = useCustomAlbumsStore((s) => s.deleteAlbum);

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

  const isCustom = id.startsWith("cust:");
  const customRecord = customAlbums.find((a) => a.id === id);

  const items: MediaItem[] = useMemo(() => {
    if (!id) return [];
    if (id === "auto:__all") return visibleItems;
    if (isCustom && customRecord) {
      const byId = new Map(visibleItems.map((i) => [i.id, i]));
      return customRecord.itemIds.map((iid) => byId.get(iid)).filter(Boolean) as MediaItem[];
    }
    if (id.startsWith("auto:")) {
      const folder = decodeURIComponent(id.slice(5));
      return visibleItems.filter((i) => i.folder === folder);
    }
    return [];
  }, [id, isCustom, customRecord, visibleItems]);

  const title = useMemo(() => {
    if (!id) return "Album";
    if (id === "auto:__all") return "All Photos";
    if (isCustom) return customRecord?.title ?? "Album";
    if (id.startsWith("auto:")) return decodeURIComponent(id.slice(5));
    return "Album";
  }, [id, isCustom, customRecord]);

  const handlePress = useCallback(
    (item: MediaItem) => {
      if (sel.mode) {
        sel.toggle(item.id);
        return;
      }
      router.push({ pathname: "/viewer/[id]", params: { id: item.id } });
    },
    [sel, router],
  );

  const selectedItems = useMemo(() => items.filter((i) => sel.selected.has(i.id)), [items, sel.selected]);

  const deleteBehavior = useSettingsStore((s) => s.deleteBehavior);
  const recycleRetentionDays = useSettingsStore((s) => s.recycleRetentionDays);

  const executeDelete = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setBusy(true);
    try {
      const result = await deleteItems(selectedItems);
      removeItems(result.removed);
      showAlert(
        result.recycled ? "Moved to Recycle Bin" : "Deleted",
        result.recycled
          ? `${result.removed.length} item(s) moved to the Recycle Bin successfully.`
          : `${result.removed.length} item(s) permanently deleted.`,
        [{ text: "OK", onPress: hideAlert }]
      );
    } catch (err: any) {
      console.error("Album item deletion failed:", err);
      showAlert("Error", err?.message ?? "Failed to delete selected items.", [{ text: "OK", onPress: hideAlert }]);
    } finally {
      sel.exit();
      setBusy(false);
    }
  }, [selectedItems, removeItems, sel, showAlert, hideAlert]);

  const confirmDelete = useCallback(() => {
    if (selectedItems.length === 0) return;

    if (deleteBehavior === "recycle") {
      showAlert(
        "Move to Recycle Bin?",
        `This will move ${selectedItems.length} selected item(s) to the Recycle Bin. They will be automatically deleted after ${recycleRetentionDays} days.\n\nTo delete them permanently, you can go to Settings, open the Recycle Bin, and purge them.`,
        [
          { text: "Cancel", onPress: hideAlert, style: "cancel" },
          { text: "Move to Bin", onPress: () => { hideAlert(); executeDelete(); }, style: "destructive" }
        ]
      );
    } else {
      showAlert(
        "Delete permanently?",
        `Are you sure you want to permanently delete ${selectedItems.length} selected item(s) from your library? This action cannot be undone.`,
        [
          { text: "Cancel", onPress: hideAlert, style: "cancel" },
          { text: "Delete", onPress: () => { hideAlert(); executeDelete(); }, style: "destructive" }
        ]
      );
    }
  }, [selectedItems, deleteBehavior, recycleRetentionDays, showAlert, hideAlert, executeDelete]);

  const lockItems = useVaultStore((s) => s.lockItems);
  const handleLockSelected = useCallback(() => {
    if (selectedItems.length === 0) return;
    const ids = selectedItems.map((i) => i.id);
    lockItems(ids);
    const count = ids.length;
    sel.exit();
    showAlert(
      "Moved to Vault",
      `${count} item(s) moved to the Private Vault.`,
      [{ text: "OK", onPress: hideAlert }]
    );
  }, [selectedItems, lockItems, sel, showAlert, hideAlert]);

  const doShare = useCallback(async () => {
    await shareItems(selectedItems);
    sel.exit();
  }, [selectedItems, sel]);

  const confirmDeleteAlbum = useCallback(() => {
    showAlert(
      "Delete album?",
      `"${title}" will be removed. Your original photos are NOT deleted.`,
      [
        { text: "Cancel", onPress: hideAlert, style: "cancel" },
        {
          text: "Delete album",
          style: "destructive",
          onPress: () => {
            hideAlert();
            deleteAlbum(id);
            router.back();
          },
        },
      ],
    );
  }, [title, id, deleteAlbum, router, showAlert, hideAlert]);

  return (
    <Screen>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.navBtn, { color: theme.accent }]}>‹ Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
        {isCustom ? (
          <Pressable onPress={confirmDeleteAlbum} hitSlop={12}>
            <Text style={[styles.navBtn, { color: theme.danger }]}>Delete</Text>
          </Pressable>
        ) : <View style={{ width: 50 }} />}
      </View>

      <PhotoGrid
        items={items}
        columns={columns}
        selectedIds={sel.selected}
        selectionMode={sel.mode}
        onPress={handlePress}
        onLongPress={(item) => !sel.mode && sel.enter(item.id)}
        emptyTitle="Empty album"
        emptyMessage={isCustom ? "Add photos to this album." : "No photos in this folder."}
      />

      {sel.mode ? (
        <SelectionBar
          count={sel.selected.size}
          onClose={sel.exit}
          actions={[
            { label: "Share", onPress: doShare, disabled: selectedItems.length === 0 },
            { label: "Set as Private", onPress: handleLockSelected, disabled: selectedItems.length === 0 },
            { label: "Delete", onPress: confirmDelete, destructive: true, disabled: busy },
          ]}
        />
      ) : null}

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  navBtn: { fontSize: 16, fontWeight: "600" },
  title: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center", marginHorizontal: spacing.sm },
});
