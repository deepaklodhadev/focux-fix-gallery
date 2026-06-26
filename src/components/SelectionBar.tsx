import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "./ThemeProvider";
import { spacing } from "@/theme/colors";

// --- Inline SVG Icons -------------------------------------------------------
const ShareIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LockIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 11V7a5 5 0 00-10 0v4m-2 0h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UnlockIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 11V7a4 4 0 118 0m-2 4h4a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2h8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

function getIconForLabel(label: string, color: string) {
  const norm = label.toLowerCase();
  if (norm.includes("share")) return <ShareIcon color={color} />;
  if (norm.includes("private") || norm.includes("lock")) return <LockIcon color={color} />;
  if (norm.includes("unlock")) return <UnlockIcon color={color} />;
  if (norm.includes("delete")) return <TrashIcon color={color} />;
  if (norm.includes("cancel") || norm.includes("close")) return <CloseIcon color={color} />;
  return null;
}

// --- Component -------------------------------------------------------------
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

/** Floating bottom capsule action bar shown during multi-select. */
export function SelectionBar({ count, onClose, actions }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.bgElevated,
          borderColor: theme.border,
          bottom: insets.bottom + spacing.md,
        },
      ]}
    >
      {/* Title / Counter Row */}
      <View style={styles.countContainer}>
        <Text style={[styles.countText, { color: theme.textMuted }]}>
          {count} {count === 1 ? "item" : "items"} selected
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Action Buttons */}
      <View style={styles.actions}>
        {actions.map((a) => {
          const color = a.disabled
            ? theme.textSubtle
            : a.destructive
            ? theme.danger
            : a.label.toLowerCase().includes("private") || a.label.toLowerCase().includes("lock") || a.label.toLowerCase().includes("unlock")
            ? theme.accent
            : theme.text;

          return (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              disabled={a.disabled}
              style={({ pressed }) => [
                styles.btn,
                {
                  opacity: a.disabled ? 0.35 : pressed ? 0.7 : 1,
                },
              ]}
            >
              {getIconForLabel(a.label, color)}
              <Text style={[styles.btnText, { color }]}>{a.label}</Text>
            </Pressable>
          );
        })}

        {/* Cancel Button */}
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.btn,
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          {getIconForLabel("Cancel", theme.textSubtle)}
          <Text style={[styles.btnText, { color: theme.textSubtle }]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  countContainer: {
    marginBottom: spacing.xs,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    width: "100%",
    marginBottom: spacing.sm,
    opacity: 0.3,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
    flex: 1,
    gap: 4,
  },
  btnText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
