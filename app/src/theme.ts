import { useColorScheme } from "react-native";

const light = {
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
const dark: typeof light = {
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
export type Palette = typeof light;

export const fonts = {
  display: "YoungSerif_400Regular",
  body: "Nunito_400Regular",
  semi: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  heavy: "Nunito_800ExtraBold",
};

export function usePalette(): { c: Palette; dark: boolean } {
  const scheme = useColorScheme();
  return scheme === "dark" ? { c: dark, dark: true } : { c: light, dark: false };
}
