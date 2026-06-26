import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme, View } from "react-native";
import { useSettingsStore } from "@/store/settings";
import { resolveTheme, type Palette } from "@/theme/colors";

const ThemeContext = createContext<Palette>(resolveTheme("system", null));

/** Provides the resolved palette based on the user's theme preference. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themePref = useSettingsStore((s) => s.theme);
  const system = useColorScheme();
  const palette = useMemo(
    () => resolveTheme(themePref, system === "dark" ? "dark" : "light"),
    [themePref, system],
  );
  return (
    <ThemeContext.Provider value={palette}>
      <View style={{ flex: 1, backgroundColor: palette.bg }}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): Palette {
  return useContext(ThemeContext);
}
