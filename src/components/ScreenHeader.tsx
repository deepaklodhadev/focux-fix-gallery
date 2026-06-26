import React from "react";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { useTheme } from "./ThemeProvider";
import { spacing } from "@/theme/colors";

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onRightPress?: () => void;
}

/** Large screen title used at the top of each tab. */
export function ScreenHeader({ title, subtitle, right, onRightPress }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.titles}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right ? (
        <Pressable onPress={onRightPress} hitSlop={12}>
          {right}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  titles: { flex: 1 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
});
