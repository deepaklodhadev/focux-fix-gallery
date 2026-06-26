import type { ThemePref } from "@/types";

export interface Palette {
  mode: "light" | "dark";
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentText: string;
  danger: string;
  scrim: string;
}

export const light: Palette = {
  mode: "light",
  bg: "#ffffff",
  bgElevated: "#f4f4f6",
  surface: "#f4f4f6",
  surfaceMuted: "#eceef1",
  border: "#e2e3e8",
  text: "#14151a",
  textMuted: "#5b5e6b",
  textSubtle: "#9a9da8",
  accent: "#0d9488",
  accentText: "#ffffff",
  danger: "#e5484d",
  scrim: "rgba(0,0,0,0.5)",
};

export const dark: Palette = {
  mode: "dark",
  bg: "#000000",
  bgElevated: "#22252a",
  surface: "#16171b",
  surfaceMuted: "#0d0e12",
  border: "#1a1c22",
  text: "#f5f6f8",
  textMuted: "#a9adba",
  textSubtle: "#6b6f7d",
  accent: "#24e0b0",
  accentText: "#000000",
  danger: "#ff6166",
  scrim: "rgba(0,0,0,0.7)",
};

export function resolveTheme(pref: ThemePref, systemColorScheme: "light" | "dark" | null): Palette {
  if (pref === "system") return (systemColorScheme === "dark" ? dark : light);
  return pref === "dark" ? dark : light;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;
