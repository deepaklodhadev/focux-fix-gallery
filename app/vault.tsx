import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Screen } from "@/components/Screen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { SelectionBar } from "@/components/SelectionBar";
import { useTheme } from "@/components/ThemeProvider";
import { useVaultStore } from "@/store/vault";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { useSelection } from "@/hooks/useSelection";
import { useSettingsStore } from "@/store/settings";
import { columnsFor } from "@/utils/grid";
import { spacing, radii } from "@/theme/colors";
import { CustomAlert, CustomAlertButton } from "@/components/CustomAlert";
import { mediaService } from "@/services";
import type { MediaItem } from "@/types";

const LockIcon = ({ color }: { color: string }) => (
  <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 11V7a5 5 0 00-10 0v4m-2 0h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BackspaceIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z M18 9l-6 6m0-6l6 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function VaultScreen() {
  const router = useRouter();
  const theme = useTheme();

  // Stores
  const { allItems, removeItems } = useMediaLibrary();
  const privateIds = useVaultStore((s) => s.privateIds);
  const passcode = useVaultStore((s) => s.passcode);
  const setPasscode = useVaultStore((s) => s.setPasscode);
  const unlockItems = useVaultStore((s) => s.unlockItems);
  const purgeItems = useVaultStore((s) => s.purgeItems);

  const gridSize = useSettingsStore((s) => s.gridSize);
  const columns = useMemo(() => columnsFor(gridSize), [gridSize]);

  // Passcode entry / Setup states
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeState, setPasscodeState] = useState<"enter" | "create" | "confirm">("enter");
  const [tempPin, setTempPin] = useState("");
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Grid/Action states
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

  // Set initial screen state based on passcode availability
  useEffect(() => {
    if (!passcode) {
      setPasscodeState("create");
    } else {
      setPasscodeState("enter");
    }
  }, [passcode]);

  // Private items selector
  const items = useMemo(() => {
    const pSet = new Set(privateIds);
    return allItems.filter((i) => pSet.has(i.id));
  }, [allItems, privateIds]);

  const selectedItems = useMemo(
    () => items.filter((i) => sel.selected.has(i.id)),
    [items, sel.selected]
  );

  const handlePinComplete = useCallback(
    (pin: string) => {
      if (passcodeState === "enter") {
        if (pin === passcode) {
          setIsUnlocked(true);
          setPinError("");
          setEnteredPin("");
        } else {
          setPinError("Incorrect passcode. Try again.");
          setEnteredPin("");
        }
      } else if (passcodeState === "create") {
        setTempPin(pin);
        setEnteredPin("");
        setPasscodeState("confirm");
      } else if (passcodeState === "confirm") {
        if (pin === tempPin) {
          setPasscode(pin);
          setIsUnlocked(true);
          setPinError("");
          setEnteredPin("");
          setTempPin("");
        } else {
          setPinError("Passcodes do not match. Restarting...");
          setEnteredPin("");
          setTempPin("");
          setPasscodeState("create");
        }
      }
    },
    [passcode, passcodeState, tempPin, setPasscode]
  );

  const handleKeyPress = useCallback(
    (num: string) => {
      if (enteredPin.length >= 4) return;
      setPinError("");
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);

      if (nextPin.length === 4) {
        setTimeout(() => {
          handlePinComplete(nextPin);
        }, 150);
      }
    },
    [enteredPin, handlePinComplete]
  );

  const handleBackspace = useCallback(() => {
    setPinError("");
    if (enteredPin.length > 0) {
      setEnteredPin(enteredPin.slice(0, -1));
    }
  }, [enteredPin]);

  // Selection actions
  const handlePress = useCallback(
    (item: MediaItem) => {
      if (sel.mode) {
        sel.toggle(item.id);
        return;
      }
      router.push({ pathname: "/viewer/[id]", params: { id: item.id } });
    },
    [sel, router]
  );

  const handleUnlockSelected = useCallback(() => {
    if (selectedItems.length === 0) return;
    const ids = selectedItems.map((i) => i.id);
    unlockItems(ids);
    sel.exit();
    showAlert("Unlocked", `${ids.length} item(s) returned to your main library.`, [
      { text: "OK", onPress: hideAlert },
    ]);
  }, [selectedItems, unlockItems, sel, showAlert, hideAlert]);

  const executeDeletePermanent = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setBusy(true);
    hideAlert();
    try {
      const ids = selectedItems.map((i) => i.id);
      await mediaService.deletePermanent(ids);
      purgeItems(ids);
      removeItems(ids);
      showAlert("Deleted", `${ids.length} item(s) permanently deleted.`, [
        { text: "OK", onPress: hideAlert },
      ]);
    } catch (err: any) {
      console.error("Vault deletion failed:", err);
      showAlert("Error", err?.message ?? "Failed to delete selected items.", [
        { text: "OK", onPress: hideAlert },
      ]);
    } finally {
      sel.exit();
      setBusy(false);
    }
  }, [selectedItems, purgeItems, removeItems, sel, showAlert, hideAlert]);

  const handleConfirmDelete = useCallback(() => {
    if (selectedItems.length === 0) return;
    showAlert(
      "Delete permanently?",
      `Are you sure you want to permanently delete ${selectedItems.length} selected item(s) from your device and vault? This action cannot be undone.`,
      [
        { text: "Cancel", onPress: hideAlert, style: "cancel" },
        { text: "Delete Permanently", onPress: executeDeletePermanent, style: "destructive" },
      ]
    );
  }, [selectedItems, showAlert, hideAlert, executeDeletePermanent]);

  // Pin reset confirmation
  const confirmResetPasscode = useCallback(() => {
    showAlert(
      "Reset Passcode?",
      "Are you sure you want to reset your vault passcode? All items in the vault will be unlocked (moved back to the public library).",
      [
        { text: "Cancel", onPress: hideAlert, style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            hideAlert();
            if (privateIds.length > 0) {
              unlockItems(privateIds);
            }
            setPasscode(null);
            setIsUnlocked(false);
            setPasscodeState("create");
            setEnteredPin("");
            setTempPin("");
            sel.exit();
          },
        },
      ]
    );
  }, [privateIds, unlockItems, setPasscode, showAlert, hideAlert, sel]);

  if (!isUnlocked) {
    return (
      <Screen>
        <View style={styles.lockScreenContainer}>
          <View style={styles.lockHeader}>
            <LockIcon color={theme.accent} />
            <Text style={[styles.lockTitle, { color: theme.text }]}>Private Vault</Text>
            <Text style={[styles.lockSubtitle, { color: theme.textMuted }]}>
              {passcodeState === "enter"
                ? "Enter your 4-digit passcode"
                : passcodeState === "create"
                ? "Create a 4-digit passcode"
                : "Confirm your 4-digit passcode"}
            </Text>
            {pinError ? (
              <Text style={[styles.errorText, { color: theme.danger }]}>{pinError}</Text>
            ) : (
              <View style={{ height: 18 }} />
            )}
          </View>

          <View style={styles.dotsContainer}>
            {[0, 1, 2, 3].map((idx) => {
              const active = idx < enteredPin.length;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: active ? theme.accent : "transparent",
                      borderColor: active ? theme.accent : theme.border,
                      borderWidth: 2,
                    },
                  ]}
                />
              );
            })}
          </View>

          <Keypad
            onPress={handleKeyPress}
            onBackspace={handleBackspace}
            onCancel={() => router.back()}
          />
        </View>

        <CustomAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          buttons={alert.buttons}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.navBtn, { color: theme.accent }]}>‹ Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          Private Vault
        </Text>
        <Pressable onPress={confirmResetPasscode} hitSlop={12}>
          <Text style={[styles.navBtn, { color: theme.accent }]}>Reset PIN</Text>
        </Pressable>
      </View>

      <PhotoGrid
        items={items}
        columns={columns}
        selectedIds={sel.selected}
        selectionMode={sel.mode}
        onPress={handlePress}
        onLongPress={(item) => !sel.mode && sel.enter(item.id)}
        emptyTitle="Vault is Empty"
        emptyMessage="Select items in your main Timeline or Albums and tap 'Lock' to hide them here."
      />

      {sel.mode ? (
        <SelectionBar
          count={sel.selected.size}
          onClose={sel.exit}
          actions={[
            { label: "Unlock", onPress: handleUnlockSelected, disabled: selectedItems.length === 0 },
            { label: "Delete", onPress: handleConfirmDelete, destructive: true, disabled: busy },
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

// --- Keypad subcomponent ---------------------------------------------------
interface KeypadProps {
  onPress: (val: string) => void;
  onBackspace: () => void;
  onCancel: () => void;
}

function Keypad({ onPress, onBackspace, onCancel }: KeypadProps) {
  const theme = useTheme();

  const renderKey = (val: string) => {
    return (
      <Pressable
        key={val}
        onPress={() => onPress(val)}
        style={({ pressed }) => [
          styles.key,
          {
            backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.keyText, { color: theme.text }]}>{val}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.keypad}>
      <View style={styles.keypadRow}>
        {renderKey("1")}
        {renderKey("2")}
        {renderKey("3")}
      </View>
      <View style={styles.keypadRow}>
        {renderKey("4")}
        {renderKey("5")}
        {renderKey("6")}
      </View>
      <View style={styles.keypadRow}>
        {renderKey("7")}
        {renderKey("8")}
        {renderKey("9")}
      </View>
      <View style={styles.keypadRow}>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.keySpecial,
            {
              backgroundColor: pressed ? "rgba(255,255,255,0.05)" : "transparent",
            },
          ]}
        >
          <Text style={[styles.keySpecialText, { color: theme.textSubtle }]}>Cancel</Text>
        </Pressable>
        {renderKey("0")}
        <Pressable
          onPress={onBackspace}
          style={({ pressed }) => [
            styles.keySpecial,
            {
              backgroundColor: pressed ? "rgba(255,255,255,0.05)" : "transparent",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <BackspaceIcon color={theme.textSubtle} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockScreenContainer: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  lockHeader: {
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  lockSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  keypad: {
    width: "100%",
    maxWidth: 280,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  key: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    fontSize: 24,
    fontWeight: "600",
  },
  keySpecial: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  keySpecialText: {
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginHorizontal: spacing.sm,
  },
});
