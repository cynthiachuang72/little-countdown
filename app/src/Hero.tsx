import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { bloomStage, LookArt, nestCaption, starlightCaption, storybookCaption } from "./art";
import { Card, T } from "./components";
import { plural } from "./lib/core";
import { isNight, type LookName } from "./lib/looks";
import { NestScene } from "./nest";
import { usePalette } from "./theme";

type Props = {
  look: LookName;
  week: number;
  months: number;
  next: { title: string; days: number } | null;
  babyName: string;
  bd: number;
  /** How many little joys are tucked into the nest. */
  joys?: number;
  /** A pregnancy milestone that falls today (a butterfly visits the nest). */
  milestoneToday?: string | null;
};

/** The drawing at the top of illustrated looks, with a line about where things are. */
export default function Hero({ look, week, months, next, babyName, bd, joys = 0, milestoneToday = null }: Props) {
  const { c, f } = usePalette();
  const night = isNight();
  const [peeking, setPeeking] = useState(false);

  if (look === "nest") {
    const caption = peeking ? `Peeking inside · week ${week}` : milestoneToday ? `A butterfly came for ${milestoneToday.toLowerCase()}!` : nestCaption(week);
    return (
      <Card style={{ alignItems: "center", gap: 4, paddingVertical: 12 }}>
        <NestScene week={week} joys={joys} butterfly={!!milestoneToday} width={260} onPeek={setPeeking} />
        <T style={{ fontFamily: f.display, fontSize: 17, lineHeight: 24, color: c.ink, textAlign: "center" }}>{caption}</T>
        <T v="small" style={{ textAlign: "center" }}>
          {joys ? `${joys} little ${plural(joys, "joy")} in your nest · ` : ""}Tap the egg, or hold to peek inside
        </T>
      </Card>
    );
  }

  let caption = "";
  if (look === "bloom") caption = `${bloomStage(week).caption} · week ${week}`;
  else if (look === "sky") caption = night ? `Sweet dreams. ${bd} ${plural(bd, "sleep")} to go.` : `Hello, sunshine. ${bd} ${plural(bd, "day")} to go.`;
  else if (look === "storybook") caption = storybookCaption(months);
  else if (look === "starlight") caption = starlightCaption(months, night, babyName);

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
    <Card style={{ alignItems: "center", gap: 4, paddingVertical: 12, backgroundColor: look === "sky" || look === "storybook" || look === "starlight" ? c.bg : c.surface }}>
      <LookArt look={look} week={week} months={months} night={night} bg={look === "sky" || look === "storybook" || look === "starlight" ? c.bg : c.surface} width={240} height={144} />
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
