import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "./ThemeProvider";
import { spacing } from "@/theme/colors";

/** Centered empty placeholder. */
export function EmptyState({
  title = "Nothing here yet",
  message,
}: {
  title?: string;
  message?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message ? <Text style={[styles.msg, { color: theme.textMuted }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  title: { fontSize: 16, fontWeight: "600" },
  msg: { fontSize: 14, marginTop: 6, textAlign: "center" },
});
