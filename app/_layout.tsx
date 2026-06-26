import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { useSettingsStore } from "@/store/settings";
import { useRecycleBinStore } from "@/store/recycleBin";

/** Auto-purge expired recycle-bin items on startup. */
function usePurgeExpiredOnLoad() {
  const retentionDays = useSettingsStore((s) => s.recycleRetentionDays);
  const purgeExpired = useRecycleBinStore((s) => s.purgeExpired);
  useEffect(() => {
    purgeExpired(retentionDays);
  }, [retentionDays, purgeExpired]);
}

function ThemedStack() {
  usePurgeExpiredOnLoad();
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="album/[id]" />
        <Stack.Screen name="album/new" />
        <Stack.Screen name="viewer/[id]" options={{ animation: "fade", presentation: "fullScreenModal" }} />
        <Stack.Screen name="recycle" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemedStack />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
