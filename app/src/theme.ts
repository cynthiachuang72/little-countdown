import { useContext } from "react";
import { useColorScheme } from "react-native";
import { FONTS, type FontSet, type LookName, type Palette, paletteFor } from "./lib/looks";
import { ThemeContext } from "./themeContext";

export type { Palette } from "./lib/looks";

/** Fonts that don't change between looks, for static styles. */
export const fonts = FONTS.calm;
export type Fonts = FontSet;

export type Look = { c: Palette; dark: boolean; f: Fonts; r: number; look: LookName; born: boolean; illustrated: boolean };

export function usePalette(): Look {
  const scheme = useColorScheme();
  const { look, born } = useContext(ThemeContext); // tick in the context re-renders Sky as the hour changes
  const { c, dark } = paletteFor(look, born, scheme === "dark");
  return { c, dark, f: FONTS[look], r: look === "calm" ? 22 : 26, look, born, illustrated: look !== "calm" };
}
