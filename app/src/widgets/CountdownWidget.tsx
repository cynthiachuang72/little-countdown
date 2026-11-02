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
};

const C = {
  bg: "#FBFCFE",
  ink: "#2A3147",
  muted: "#6B7390",
  rose: "#C9738B",
  roseSoft: "#F6E3E9",
  sage: "#5F9274",
  sageSoft: "#E1EEE6",
} as const;

function Tile({ num, label, soft, strong }: { num: number; label: string; soft: string; strong: string }) {
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
      <TextWidget text={String(num)} style={{ fontSize: 34, fontFamily: "serif", color: strong as `#${string}` }} />
      <TextWidget text={label} style={{ fontSize: 12, color: C.muted, fontWeight: "700" }} maxLines={1} />
    </FlexWidget>
  );
}

/** Android home screen widget. Tapping it opens the app. */
export function CountdownWidget({ babyDays, leaveDays, workdays, week, joy, sample }: Props) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: C.bg,
        borderRadius: 26,
        padding: 14,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <FlexWidget style={{ width: "match_parent", flexDirection: "row", justifyContent: "space-between" }}>
        <TextWidget text="Little Countdown" style={{ fontSize: 12, color: C.muted, fontWeight: "700" }} />
        <TextWidget text={`Week ${week}`} style={{ fontSize: 12, color: C.rose, fontWeight: "700" }} />
      </FlexWidget>
      <FlexWidget style={{ width: "match_parent", flex: 1, flexDirection: "row", flexGap: 8, marginTop: 8, marginBottom: 8 }}>
        <Tile num={babyDays} label={babyDays === 1 ? "day to baby" : "days to baby"} soft={C.roseSoft} strong={C.rose} />
        <Tile num={leaveDays} label={`${workdays} workdays to leave`} soft={C.sageSoft} strong={C.sage} />
      </FlexWidget>
      <TextWidget
        text={sample ? "Example dates. Open the app to add yours." : `Today: ${joy}`}
        style={{ fontSize: 13, color: C.ink }}
        maxLines={2}
        truncate="END"
      />
    </FlexWidget>
  );
}
