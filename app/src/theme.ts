import { useContext } from "react";
import { useColorScheme } from "react-native";
import type { ThemeName } from "./lib/core";
import { ThemeContext } from "./themeContext";

const calmLight = {
  bg: "#EDF0F6",
  surface: "#FBFCFE",
  ink: "#2A3147",
  muted: "#6B7390",
  line: "#DCE1EC",
  rose: "#C9738B",
  roseSoft: "#F6E3E9",
  sage: "#5F9274",
  sageSoft: "#E1EEE6",
  sky: "#7C8CC4",
  scrim: "rgba(20,24,36,0.4)",
};
export type Palette = typeof calmLight;

const calmDark: Palette = {
  bg: "#161A25",
  surface: "#202535",
  ink: "#E9ECF4",
  muted: "#9AA2BC",
  line: "#2E3448",
  rose: "#E7A3B6",
  roseSoft: "#3A2C37",
  sage: "#9CC4AB",
  sageSoft: "#26352F",
  sky: "#A7B3E2",
  scrim: "rgba(0,0,0,0.55)",
};

// Cute: blush and bubblegum with mint and lavender, like a nursery in spring.
const cuteLight: Palette = {
  bg: "#FFF0F4",
  surface: "#FFFFFF",
  ink: "#5A3B52",
  muted: "#A27F96",
  line: "#F6D5E0",
  rose: "#F2709A",
  roseSoft: "#FFDDE8",
  sage: "#2FA582",
  sageSoft: "#D6F5EA",
  sky: "#A98BF5",
  scrim: "rgba(90,59,82,0.35)",
};
const cuteDark: Palette = {
  bg: "#271C2A",
  surface: "#362839",
  ink: "#FCEAF1",
  muted: "#CDAEC3",
  line: "#4B3A4F",
  rose: "#FF9DBC",
  roseSoft: "#4C2E40",
  sage: "#7EDBBD",
  sageSoft: "#21403A",
  sky: "#C8B4FF",
  scrim: "rgba(0,0,0,0.55)",
};

export const fonts = {
  display: "YoungSerif_400Regular",
  body: "Nunito_400Regular",
  semi: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  heavy: "Nunito_800ExtraBold",
};
export type Fonts = typeof fonts;
const cuteFonts: Fonts = { ...fonts, display: "Fredoka_600SemiBold" };

export type Look = { c: Palette; dark: boolean; f: Fonts; r: number; cute: boolean; name: ThemeName };

export function usePalette(): Look {
  const scheme = useColorScheme();
  const name = useContext(ThemeContext);
  const dark = scheme === "dark";
  if (name === "cute") return { c: dark ? cuteDark : cuteLight, dark, f: cuteFonts, r: 28, cute: true, name };
  return { c: dark ? calmDark : calmLight, dark, f: fonts, r: 22, cute: false, name };
}

/** Swatches for the theme picker. */
export const THEMES: { name: ThemeName; label: string; note: string; swatch: string[] }[] = [
  { name: "calm", label: "Calm", note: "Soft blue-grey, quiet and simple", swatch: [calmLight.bg, calmLight.rose, calmLight.sage] },
  { name: "cute", label: "Cute", note: "Blush pink, mint and a little sparkle", swatch: [cuteLight.bg, cuteLight.rose, cuteLight.sage] },
];
