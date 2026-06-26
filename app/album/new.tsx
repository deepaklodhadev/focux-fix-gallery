import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/components/ThemeProvider";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { useCustomAlbumsStore } from "@/store/customAlbums";
import { columnsFor } from "@/utils/grid";
import { useSettingsStore } from "@/store/settings";
import type { MediaItem } from "@/types";
import { radii, spacing } from "@/theme/colors";
import { CustomAlert, CustomAlertButton } from "@/components/CustomAlert";

export default function NewAlbumScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { visibleItems } = useMediaLibrary();
  const columns = columnsFor(useSettingsStore((s) => s.gridSize));
  const createAlbum = useCustomAlbumsStore((s) => s.createAlbum);

  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCreate = useCallback(() => {
    const name = title.trim();
    if (!name) {
      showAlert("Name required", "Please enter a name for your album.", [{ text: "OK", onPress: hideAlert }]);
      return;
    }
    const id = createAlbum(name, [...selected]);
    showAlert("Album created", `"${name}" with ${selected.size} photo(s).`, [
      { text: "OK", onPress: () => { hideAlert(); router.replace({ pathname: "/album/[id]", params: { id } }); } },
    ]);
  }, [title, selected, createAlbum, router, showAlert, hideAlert]);

  return (
    <Screen>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.navBtn, { color: theme.textMuted }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>New Album</Text>
        <Pressable onPress={handleCreate} hitSlop={12}>
          <Text style={[styles.navBtn, { color: theme.accent, fontWeight: "700" }]}>Create</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Album name"
          placeholderTextColor={theme.textSubtle}
          style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
          autoFocus
        />
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          {selected.size} photo(s) selected · tap to add/remove
        </Text>
      </View>

      <PickerGrid items={visibleItems} columns={columns} selected={selected} onToggle={toggle} />

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
      />
    </Screen>
  );
}

function PickerGrid({
  items,
  columns,
  selected,
  onToggle,
}: {
  items: MediaItem[];
  columns: number;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const gap = 2;
  const cell = (width - gap * (columns - 1)) / columns;
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      numColumns={columns}
      contentContainerStyle={{ paddingHorizontal: gap / 2, paddingBottom: 60 }}
      renderItem={({ item }) => {
        const isSel = selected.has(item.id);
        return (
          <Pressable onPress={() => onToggle(item.id)} style={{ margin: gap / 2 }}>
            <Image source={item.uri} style={{ width: cell, height: cell, borderRadius: radii.sm }} contentFit="cover" />
            <View
              style={[
                styles.check,
                { borderColor: "#fff", backgroundColor: isSel ? theme.accent : "rgba(0,0,0,0.25)" },
              ]}
              pointerEvents="none"
            >
              {isSel ? <Text style={styles.checkText}>✓</Text> : null}
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  navBtn: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: "700" },
  input: { height: 46, borderRadius: radii.md, paddingHorizontal: spacing.md, fontSize: 16, borderWidth: StyleSheet.hairlineWidth },
  hint: { fontSize: 13, marginTop: spacing.sm },
  check: { position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  checkText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
