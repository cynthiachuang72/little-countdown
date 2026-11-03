import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export const WIDGET_NAME = "LittleCountdown";

type Props = {
  babyDays: number;
  leaveDays: number;
  workdays: number;
  week: number;
  joy: string;
  sample?: boolean;
  cute?: boolean;
  born?: boolean;
  ageNum?: number;
  ageUnit?: string;
  nextTitle?: string;
  nextDays?: number;
  babyName?: string;
};

const CALM = {
  bg: "#FBFCFE",
  ink: "#2A3147",
  muted: "#6B7390",
  rose: "#C9738B",
  roseSoft: "#F6E3E9",
  sage: "#5F9274",
  sageSoft: "#E1EEE6",
};
const CUTE: typeof CALM = {
  bg: "#FFFFFF",
  ink: "#5A3B52",
  muted: "#A27F96",
  rose: "#F2709A",
  roseSoft: "#FFDDE8",
  sage: "#2FA582",
  sageSoft: "#D6F5EA",
};

function Tile({ num, label, soft, strong, muted, font }: { num: number; label: string; soft: string; strong: string; muted: string; font: string }) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        height: "match_parent",
        backgroundColor: soft as `#${string}`,
        borderRadius: 18,
        padding: 10,
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <TextWidget text={String(num)} style={{ fontSize: 34, fontFamily: font, color: strong as `#${string}` }} />
      <TextWidget text={label} style={{ fontSize: 12, color: muted as `#${string}`, fontWeight: "700" }} maxLines={1} />
    </FlexWidget>
  );
}

/** Android home screen widget. Tapping it opens the app. */
export function CountdownWidget({ babyDays, leaveDays, workdays, week, joy, sample, cute, born, ageNum = 0, ageUnit = "", nextTitle = "", nextDays = 0, babyName = "" }: Props) {
  const C = cute ? CUTE : CALM;
  const font = cute ? "sans-serif-medium" : "serif";
  const hex = (x: string) => x as `#${string}`;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: hex(C.bg),
        borderRadius: cute ? 30 : 26,
        padding: 14,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <FlexWidget style={{ width: "match_parent", flexDirection: "row", justifyContent: "space-between" }}>
        <TextWidget text="Little Countdown" style={{ fontSize: 12, color: hex(C.muted), fontWeight: "700" }} />
        <TextWidget text={born ? babyName || "Baby" : `Week ${week}`} style={{ fontSize: 12, color: hex(C.rose), fontWeight: "700" }} />
      </FlexWidget>
      <FlexWidget style={{ width: "match_parent", flex: 1, flexDirection: "row", flexGap: 8, marginTop: 8, marginBottom: 8 }}>
        <Tile num={born ? ageNum : babyDays} label={born ? ageUnit : babyDays === 1 ? "day to baby" : "days to baby"}
          soft={C.roseSoft} strong={C.rose} muted={C.muted} font={font} />
        <Tile num={born ? nextDays : leaveDays} label={born ? (nextDays === 0 ? `${nextTitle} today!` : `days to ${nextTitle}`) : `${workdays} workdays to leave`}
          soft={C.sageSoft} strong={C.sage} muted={C.muted} font={font} />
      </FlexWidget>
      <TextWidget
        text={sample ? "Example dates. Open the app to add yours." : `Today: ${joy}`}
        style={{ fontSize: 13, color: hex(C.ink) }}
        maxLines={2}
        truncate="END"
      />
    </FlexWidget>
  );
}
