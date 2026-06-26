import React from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "./ThemeProvider";
import { spacing, radii } from "@/theme/colors";

export interface CustomAlertButton {
  text: string;
  onPress: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface Props {
  visible: boolean;
  title: string;
  message: string;
  buttons: CustomAlertButton[];
}

export function CustomAlert({ visible, title, message, buttons }: Props) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: theme.scrim }]}>
        <View style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text>
          
          <View style={styles.actions}>
            {buttons.map((btn, idx) => {
              const isDestructive = btn.style === "destructive";
              const isCancel = btn.style === "cancel";
              
              let bgColor = theme.surfaceMuted;
              let textColor = theme.text;
              
              if (isDestructive) {
                bgColor = theme.danger;
                textColor = "#ffffff";
              } else if (!isCancel) {
                bgColor = theme.accent;
                textColor = theme.accentText;
              }

              return (
                <Pressable
                  key={idx}
                  onPress={btn.onPress}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      backgroundColor: bgColor,
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }]
                    }
                  ]}
                >
                  <Text style={[styles.btnText, { color: textColor }]}>{btn.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  dialog: {
    width: "100%",
    maxWidth: 320,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: "wrap",
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
