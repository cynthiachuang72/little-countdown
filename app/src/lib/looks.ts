// Every look's colors and fonts. Pure data, shared by the app and the Android widget.
// The iPhone widget has the same table in Swift (targets/widget/LittleCountdownWidget.swift).

export type LookName = "calm" | "bloom" | "nest" | "sky" | "storybook" | "friend" | "starlight";
export const PREGNANCY_LOOKS: LookName[] = ["calm", "bloom", "nest", "sky"];
export const BABY_LOOKS: LookName[] = ["calm", "storybook", "friend", "starlight"];

/** The story: what each pregnancy look becomes after "Baby is here!". */
export const STORY: Record<LookName, LookName> = {
  calm: "calm",
  bloom: "storybook",
  nest: "friend",
  sky: "starlight",
  storybook: "storybook",
  friend: "friend",
  starlight: "starlight",
};

export type Palette = {
  bg: string; surface: string; ink: string; muted: string; line: string;
  /** First accent: baby's countdown or age. */
  rose: string; roseSoft: string;
  /** Second accent: leave, or the next milestone. */
  sage: string; sageSoft: string;
  /** Third accent: sun, chick yellow, highlights. */
  sky: string;
  scrim: string;
};

type Pair = { light: Palette; dark: Palette };

const P = (bg: string, surface: string, ink: string, muted: string, line: string, rose: string, roseSoft: string, sage: string, sageSoft: string, sky: string, scrim: string): Palette =>
  ({ bg, surface, ink, muted, line, rose, roseSoft, sage, sageSoft, sky, scrim });

export const PALETTES: Record<string, Pair> = {
  calm: {
    light: P("#EDF0F6", "#FBFCFE", "#2A3147", "#6B7390", "#DCE1EC", "#C9738B", "#F6E3E9", "#5F9274", "#E1EEE6", "#7C8CC4", "rgba(20,24,36,0.4)"),
    dark: P("#161A25", "#202535", "#E9ECF4", "#9AA2BC", "#2E3448", "#E7A3B6", "#3A2C37", "#9CC4AB", "#26352F", "#A7B3E2", "rgba(0,0,0,0.55)"),
  },
  // Calm after birth: same quiet feel, warmer coral and a soft blue so the change is easy to see.
  calmBaby: {
    light: P("#EFEDF5", "#FCFBFE", "#33304A", "#77728F", "#E0DCEB", "#D98270", "#F7E4DF", "#5E86B8", "#E2EAF4", "#9C8CC8", "rgba(30,26,50,0.4)"),
    dark: P("#18172A", "#232238", "#ECEAF4", "#A29EBB", "#34324C", "#F0A595", "#3D2B2C", "#A3BEDF", "#253244", "#BDB1E6", "rgba(0,0,0,0.55)"),
  },
  bloom: {
    light: P("#EEF5E6", "#FFFFFF", "#2F4A2C", "#6B8466", "#D7E6CC", "#D4637F", "#FBE3E8", "#4F8A4A", "#DDEDD3", "#E0A93A", "rgba(30,48,28,0.35)"),
    dark: P("#18231A", "#22301F", "#E8F1E2", "#A7BDA0", "#33452F", "#F08FA6", "#45262F", "#92C98A", "#24391F", "#F2C66B", "rgba(0,0,0,0.55)"),
  },
  nest: {
    light: P("#F6EBDD", "#FFFBF5", "#5A3F2C", "#8F7360", "#EBDCC8", "#C46A4B", "#F8DFD2", "#55794A", "#DCE8D2", "#B98A5E", "rgba(60,40,28,0.35)"),
    dark: P("#221A14", "#2E241C", "#F4E9DE", "#C2AA96", "#43362A", "#EB967A", "#4A2D22", "#9EC28F", "#26341F", "#D3A77B", "rgba(0,0,0,0.55)"),
  },
  // Sky follows the clock instead of the phone's dark mode.
  sky: {
    light: P("#CFE8FA", "#FFFFFF", "#1E3A5C", "#5B7593", "#BFDDF2", "#E8784A", "#FFE3D3", "#2F86C2", "#D9EEFB", "#FFC94A", "rgba(20,40,70,0.35)"),
    dark: P("#1F2350", "#2A2F66", "#F3EEFF", "#B9B6E8", "#3A3F7A", "#FFE7A3", "#3A3A6E", "#C7B8FF", "#34386F", "#FFE7A3", "rgba(0,0,0,0.55)"),
  },
  storybook: {
    light: P("#D8ECFA", "#FFFFFF", "#30507A", "#6A84A6", "#C6DDF0", "#E8708F", "#FDE3EA", "#3F9C74", "#DDF3E8", "#F6C453", "rgba(30,50,80,0.35)"),
    dark: P("#17233A", "#213049", "#E6EFFA", "#9FB3CE", "#2F4262", "#F59AB2", "#45293A", "#86D1AE", "#1F3B33", "#F6D27A", "rgba(0,0,0,0.55)"),
  },
  friend: {
    light: P("#FFE6D5", "#FFFFFF", "#6A3B2A", "#9B6E5C", "#F3D2C0", "#D9603F", "#FFD3C2", "#3E7A3A", "#D3EBCD", "#F7C548", "rgba(80,40,25,0.35)"),
    dark: P("#2A1C16", "#382720", "#F8E6DC", "#C9A595", "#4D372D", "#F58E70", "#4D2A20", "#93C98D", "#24381F", "#F7D36E", "rgba(0,0,0,0.55)"),
  },
};

export function isNight(now: Date = new Date()): boolean {
  const h = now.getHours();
  return h < 6 || h >= 19;
}

/** Colors for a look. Sky uses the time of day; the rest follow the phone's light or dark mode. */
export function paletteFor(look: LookName, born: boolean, darkMode: boolean, now: Date = new Date()): { c: Palette; dark: boolean } {
  // Sky and Starlight follow the time of day instead of the phone's dark mode.
  if (look === "sky" || look === "starlight") {
    const night = isNight(now);
    return { c: night ? PALETTES.sky.dark : PALETTES.sky.light, dark: night };
  }
  const key = look === "calm" && born ? "calmBaby" : look;
  const pair = PALETTES[key] || PALETTES.calm;
  return { c: darkMode ? pair.dark : pair.light, dark: darkMode };
}

export type FontSet = { display: string; body: string; semi: string; bold: string; heavy: string };
const NUNITO = { body: "Nunito_400Regular", semi: "Nunito_600SemiBold", bold: "Nunito_700Bold", heavy: "Nunito_800ExtraBold" };
export const FONTS: Record<LookName, FontSet> = {
  calm: { display: "YoungSerif_400Regular", ...NUNITO },
  bloom: { display: "YoungSerif_400Regular", ...NUNITO },
  nest: { display: "Fredoka_600SemiBold", ...NUNITO },
  sky: { display: "Fredoka_600SemiBold", ...NUNITO },
  starlight: { display: "Fredoka_600SemiBold", ...NUNITO },
  storybook: { display: "Gaegu_700Bold", ...NUNITO },
  friend: { display: "Fredoka_600SemiBold", ...NUNITO },
};

export const LOOK_INFO: Record<LookName, { label: string; note: string }> = {
  calm: { label: "Calm", note: "Quiet and simple" },
  bloom: { label: "Bloom", note: "A flower grows week by week" },
  nest: { label: "Little nest", note: "An egg waits in a cozy nest" },
  sky: { label: "Sky", note: "Sun by day, stars at night" },
  starlight: { label: "Starlight", note: "A new star for every month" },
  storybook: { label: "Storybook", note: "Clouds and a little seedling" },
  friend: { label: "Little friend", note: "A chick who cheers you on" },
};
