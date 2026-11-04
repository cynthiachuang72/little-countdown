import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, Modal, StyleSheet, View, useWindowDimensions } from "react-native";
import { LookArt } from "./art";
import { Pill, T } from "./components";
import { activeLook } from "./lib/core";
import { isNight, type LookName, paletteFor } from "./lib/looks";
import { useStore } from "./store";
import { usePalette } from "./theme";

const COLORS = ["#F4A7B9", "#FFE08A", "#8DBE78", "#9FD0E6", "#F7C548", "#C7B8FF"];

/**
 * Plays once after "Baby is here!": the pregnancy drawing wiggles (the egg cracks, the flower finishes opening),
 * then the after-birth drawing pops in with confetti.
 */
export default function Celebration({ from, onDone }: { from: LookName | null; onDone: () => void }) {
  const { state } = useStore();
  const { c, f, dark } = usePalette(); // already the new, after-birth look
  const { width, height } = useWindowDimensions();
  const to = activeLook(state);
  const old = from ? paletteFor(from, false, dark) : null;

  const wobble = useRef(new Animated.Value(0)).current;
  const oldOut = useRef(new Animated.Value(0)).current;
  const newIn = useRef(new Animated.Value(0)).current;
  const fall = useRef(new Animated.Value(0)).current;
  const bits = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    x: ((i * 37) % 100) / 100, delay: (i % 7) * 0.08, size: 6 + (i % 4) * 3, color: COLORS[i % COLORS.length], spin: i % 2 ? 1 : -1,
  })), []);

  useEffect(() => {
    if (!from) return;
    [wobble, oldOut, newIn, fall].forEach((v) => v.setValue(0));
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) { oldOut.setValue(1); newIn.setValue(1); return; }
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(oldOut, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.spring(newIn, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
          Animated.timing(fall, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]).start();
    });
    return () => { cancelled = true; };
  }, [from]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!from) return null;
  const rotate = wobble.interpolate({ inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1], outputRange: ["0deg", "-7deg", "7deg", "-6deg", "6deg", "-3deg", "3deg", "0deg"] });
  const who = state.babyName || "little one";

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onDone}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: 24, gap: 18 }]}>
        {bits.map((b, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: "absolute", top: -20, left: b.x * width, width: b.size, height: b.size * 1.4, borderRadius: 2, backgroundColor: b.color,
              opacity: fall.interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, height * (0.75 + b.delay)] }) },
                { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${b.spin * 540}deg`] }) },
              ],
            }}
          />
        ))}

        <View style={{ width: 280, height: 170, alignItems: "center", justifyContent: "center" }}>
          <Animated.View style={[StyleSheet.absoluteFill, s.center, {
            opacity: oldOut.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ rotate }, { scale: oldOut.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }],
          }]}>
            {from === "calm"
              ? <Ionicons name="heart-outline" size={90} color={old!.c.rose} />
              : <LookArt look={from} week={40} months={0} night={isNight()} bg={c.bg} width={280} height={168} />}
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, s.center, {
            opacity: newIn,
            transform: [{ scale: newIn.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
          }]}>
            {to === "calm"
              ? <Ionicons name="heart" size={96} color={c.rose} />
              : <LookArt look={to} week={40} months={0} night={isNight()} bg={c.bg} width={280} height={168} />}
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: newIn, alignItems: "center", gap: 6 }}>
          <T style={{ fontFamily: f.display, fontSize: 32, lineHeight: 40, color: c.ink, textAlign: "center" }}>Welcome, {who}!</T>
          <T v="small" style={{ textAlign: "center", fontSize: 15, lineHeight: 21 }}>
            Little Countdown will now count down to {state.babyName || "baby"}'s milestones.
          </T>
        </Animated.View>
        <Animated.View style={{ opacity: newIn }}>
          <Pill label="Let's go" primary onPress={onDone} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({ center: { alignItems: "center", justifyContent: "center" } });
