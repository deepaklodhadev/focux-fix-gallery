import React from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./ThemeProvider";
import { radii, spacing } from "@/theme/colors";

interface Action {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface Props {
  count: number;
  onClose: () => void;
  actions: Action[];
}

/** Sticky bottom action bar shown during multi-select. */
export function SelectionBar({ count, onClose, actions }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.bgElevated,
          borderColor: theme.border,
          paddingBottom: insets.bottom + 6,
        },
      ]}
    >
      <View style={[styles.left]}>
        <Text style={[styles.count, { color: theme.text }]}>
          {count} selected
        </Text>
      </View>
      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            disabled={a.disabled}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: pressed ? theme.surfaceMuted : theme.surface, opacity: a.disabled ? 0.4 : 1 },
            ]}
          >
            <Text style={[styles.btnText, { color: a.destructive ? theme.danger : theme.text }]}>
              {a.label}
            </Text>
          </Pressable>
        ))}
        <Pressable onPress={onClose} style={({ pressed }) => [styles.btn, { backgroundColor: pressed ? theme.surfaceMuted : theme.surface }]}>
          <Text style={[styles.btnText, { color: theme.textMuted }]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  left: { marginBottom: spacing.xs },
  count: { fontSize: 14, fontWeight: "600" },
  actions: { flexDirection: "row", gap: spacing.sm },
  btn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md },
  btnText: { fontSize: 14, fontWeight: "600" },
});
