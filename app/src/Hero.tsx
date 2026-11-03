import React from "react";
import { StyleSheet, View } from "react-native";
import { bloomStage, LookArt, nestCaption, storybookCaption } from "./art";
import { Card, T } from "./components";
import { plural } from "./lib/core";
import { isNight, type LookName } from "./lib/looks";
import { usePalette } from "./theme";

type Props = {
  look: LookName;
  week: number;
  months: number;
  next: { title: string; days: number } | null;
  babyName: string;
  bd: number;
};

/** The drawing at the top of illustrated looks, with a line about where things are. */
export default function Hero({ look, week, months, next, babyName, bd }: Props) {
  const { c, f } = usePalette();
  const night = isNight();

  let caption = "";
  if (look === "bloom") caption = `${bloomStage(week).caption} · week ${week}`;
  else if (look === "nest") caption = nestCaption(week);
  else if (look === "sky") caption = night ? `Sweet dreams. ${bd} ${plural(bd, "sleep")} to go.` : `Hello, sunshine. ${bd} ${plural(bd, "day")} to go.`;
  else if (look === "storybook") caption = storybookCaption(months);

  if (look === "friend") {
    const who = babyName || "baby";
    const line = !next ? `Look how big ${who} is getting!`
      : next.days === 0 ? `Today ${who} is ${next.title}! Yay!`
      : `${next.days} ${plural(next.days, "sleep")} until ${who} is ${next.title}!`;
    return (
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10 }}>
        <LookArt look={look} week={week} months={months} night={night} bg={c.surface} width={130} height={92} />
        <View style={[s.bubble, { backgroundColor: c.roseSoft }]}>
          <View style={[s.tail, { borderRightColor: c.roseSoft }]} />
          <T style={{ fontFamily: f.display, fontSize: 18, lineHeight: 24, color: c.ink }}>{line}</T>
        </View>
      </Card>
    );
  }

  return (
    <Card style={{ alignItems: "center", gap: 4, paddingVertical: 12, backgroundColor: look === "sky" || look === "storybook" ? c.bg : c.surface }}>
      <LookArt look={look} week={week} months={months} night={night} bg={look === "sky" || look === "storybook" ? c.bg : c.surface} width={240} height={144} />
      <T style={{ fontFamily: f.display, fontSize: look === "storybook" ? 22 : 17, lineHeight: 26, color: c.ink, textAlign: "center" }}>{caption}</T>
    </Card>
  );
}

const s = StyleSheet.create({
  bubble: { flex: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, position: "relative" },
  tail: {
    position: "absolute", left: -10, top: "50%", marginTop: -8, width: 0, height: 0,
    borderTopWidth: 8, borderBottomWidth: 8, borderRightWidth: 10, borderTopColor: "transparent", borderBottomColor: "transparent",
  },
});
