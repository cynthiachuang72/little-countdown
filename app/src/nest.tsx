import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Pressable, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path } from "react-native-svg";

// The Little nest look. Everything is drawn on a 200 x 120 canvas.
// The scene is three layers so the egg can move on its own:
//   back  (branch, leaves, flowers, glow, parent bird, butterfly)
//   egg   (grows each week, speckles, cracks, or the peek-inside view)
//   front (the nest, blanket and the little joys you've collected)

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const EGG_BOTTOM = 86;
// The scene is cropped to the part of the canvas that has drawing in it.
const VB = "0 10 200 104";
const RATIO = 104 / 200;
const VB_CENTER_Y = 10 + 104 / 2;

export type NestProps = { week: number; joys: number; butterfly: boolean };

/** Egg size for a week: small early on, full size near the due date. */
function eggSize(week: number) {
  const rx = 9 + ((clamp(week, 4, 40) - 4) / 36) * 14;
  const ry = rx * 1.3;
  return { rx, ry, cx: 100, cy: EGG_BOTTOM - ry };
}

export function nestCaption(week: number): string {
  if (week < 8) return "A few twigs and a tiny egg";
  if (week < 16) return "The nest is taking shape";
  if (week < 28) return "Safe and warm in the nest";
  if (week < 34) return "A warm glow and a cozy blanket";
  if (week < 37) return "Getting wiggly in there";
  if (week < 39) return "A tiny crack appeared";
  return "Crack, crack… almost time!";
}

// ---------------------------------------------------------------- pieces
function SmallLeaf({ x, y, flip, s = 1 }: { x: number; y: number; flip?: boolean; s?: number }) {
  const k = flip ? -1 : 1;
  return <Path d={`M ${x} ${y} q ${7 * k * s} ${-9 * s} ${16 * k * s} ${-6 * s} q ${-6 * k * s} ${8 * s} ${-16 * k * s} ${6 * s} Z`} fill="#8DBE78" />;
}

function Blossom({ x, y, r = 3.4, color = "#F4A7B9" }: { x: number; y: number; r?: number; color?: string }) {
  return (
    <G>
      <Circle cx={x - r * 0.8} cy={y} r={r} fill={color} />
      <Circle cx={x + r * 0.8} cy={y} r={r} fill={color} />
      <Circle cx={x} cy={y - r * 0.8} r={r} fill={color} />
      <Circle cx={x} cy={y + r * 0.8} r={r} fill={color} />
      <Circle cx={x} cy={y} r={r * 0.6} fill="#FFE08A" />
    </G>
  );
}

function ParentBird({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={13} ry={10} fill="#C98B62" />
      <Path d={`M ${x - 12} ${y - 2} q -9 -2 -12 6 q 8 -1 12 -2 Z`} fill="#B07650" />
      <Circle cx={x + 10} cy={y - 8} r={7} fill="#C98B62" />
      <Path d={`M ${x + 16} ${y - 9} l 7 2 l -7 2 Z`} fill="#F08A3C" />
      <Circle cx={x + 11.5} cy={y - 9.5} r={1.4} fill="#4A2A1E" />
      <Ellipse cx={x + 1} cy={y + 2} rx={7} ry={5} fill="#E8B48E" />
      <Line x1={x - 3} y1={y + 9} x2={x - 4} y2={y + 13} stroke="#F08A3C" strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={x + 4} y1={y + 9} x2={x + 5} y2={y + 13} stroke="#F08A3C" strokeWidth={1.6} strokeLinecap="round" />
    </G>
  );
}

function Butterfly({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Ellipse cx={x - 6} cy={y - 4} rx={6} ry={7} fill="#C7B8FF" />
      <Ellipse cx={x + 6} cy={y - 4} rx={6} ry={7} fill="#C7B8FF" />
      <Ellipse cx={x - 5} cy={y + 5} rx={4} ry={5} fill="#F4A7B9" />
      <Ellipse cx={x + 5} cy={y + 5} rx={4} ry={5} fill="#F4A7B9" />
      <Line x1={x} y1={y - 8} x2={x} y2={y + 9} stroke="#5A3F2C" strokeWidth={2} strokeLinecap="round" />
      <Path d={`M ${x} ${y - 8} q -3 -5 -6 -6 M ${x} ${y - 8} q 3 -5 6 -6`} stroke="#5A3F2C" strokeWidth={1.2} fill="none" />
    </G>
  );
}

/** One little joy, tucked into the nest. Cycles twig, feather, flower, leaf. */
function Keepsake({ i }: { i: number }) {
  const row = Math.floor(i / 12) % 3;
  const t = (i * 0.618034) % 1;
  const x = 100 + (t * 2 - 1) * (40 - row * 12);
  const y = 87 + row * 5 + 5 * (1 - (t * 2 - 1) ** 2);
  switch (i % 4) {
    case 0: return <Line x1={x - 6} y1={y + 2} x2={x + 6} y2={y - 2} stroke="#6E4B2E" strokeWidth={2} strokeLinecap="round" />;
    case 1: return <Path d={`M ${x - 5} ${y + 3} q 4 -9 10 -8 q -3 6 -10 8 Z`} fill={i % 8 === 1 ? "#F29BB5" : "#9FD0E6"} />;
    case 2: return <Blossom x={x} y={y} r={2.2} color={i % 8 === 2 ? "#F4A7B9" : "#FFFFFF"} />;
    default: return <Ellipse cx={x} cy={y} rx={4.5} ry={2.4} fill="#8DBE78" transform={`rotate(${i % 2 ? 25 : -25} ${x} ${y})`} />;
  }
}

// ---------------------------------------------------------------- layers
function BackLayer({ week, butterfly }: { week: number; butterfly: boolean }) {
  const { cx, cy, ry } = eggSize(week);
  return (
    <G>
      {week >= 28 ? <Circle cx={cx} cy={cy + 2} r={ry + 14} fill="#FFE7A3" opacity={0.45} /> : null}
      <Path d="M 6 106 Q 100 96 194 98" stroke="#8A6244" strokeWidth={6} fill="none" strokeLinecap="round" />
      <Path d="M 160 99 q 8 -6 14 -16" stroke="#8A6244" strokeWidth={3} fill="none" strokeLinecap="round" />
      {week >= 12 ? <><SmallLeaf x={30} y={103} /><SmallLeaf x={38} y={102} flip s={0.8} /><SmallLeaf x={172} y={86} s={0.9} /></> : null}
      {week >= 20 ? <><SmallLeaf x={16} y={105} flip s={0.8} /><SmallLeaf x={182} y={98} s={0.8} /></> : null}
      {week >= 28 ? <><Blossom x={24} y={95} /><Blossom x={44} y={92} r={2.8} color="#FFFFFF" /></> : null}
      {week >= 37 ? <ParentBird x={174} y={78} /> : null}
      {butterfly ? <Butterfly x={38} y={28} /> : null}
    </G>
  );
}

const SPECKLES: [number, number][] = [[-0.3, -0.35], [0.25, 0.05], [-0.4, 0.25], [0.35, -0.5], [0.05, 0.5], [-0.55, -0.1], [0.5, 0.35], [-0.1, -0.65], [0.15, -0.2], [-0.25, 0.6]];

function EggLayer({ week, peek }: { week: number; peek: boolean }) {
  const { rx, ry, cx, cy } = eggSize(week);
  if (peek) {
    // "Candling": a light shines through the egg and shows a little shape that grows with the weeks.
    const f = clamp((week - 6) / 34, 0.18, 1);
    return (
      <G>
        <Circle cx={cx} cy={cy} r={ry + 8} fill="#FFE7A3" opacity={0.6} />
        <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFD08A" stroke="#F2A65A" strokeWidth={1.5} />
        <Ellipse cx={cx + rx * 0.08 * f} cy={cy + ry * 0.18} rx={rx * 0.62 * f} ry={ry * 0.5 * f} fill="#C8742F" opacity={0.45} />
        <Circle cx={cx - rx * 0.2 * f} cy={cy - ry * 0.22 * f} r={rx * 0.36 * f} fill="#C8742F" opacity={0.45} />
      </G>
    );
  }
  const speckles = clamp(Math.floor(week / 4), 0, SPECKLES.length);
  const k = rx / 23; // cracks scale with the egg
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFF8EE" stroke="#E9D3BA" strokeWidth={1.5} />
      {SPECKLES.slice(0, speckles).map(([dx, dy], i) => (
        <Circle key={i} cx={cx + dx * rx} cy={cy + dy * ry} r={(i % 3 === 0 ? 2.4 : 1.8) * Math.max(0.6, k)} fill="#E9B8A0" />
      ))}
      {week >= 37 ? (
        <Path d={`M ${cx - 16 * k} ${cy - 6 * k} l ${6 * k} ${-5 * k} l ${5 * k} ${6 * k} l ${6 * k} ${-6 * k} l ${5 * k} ${5 * k}`} stroke="#B98A5E" strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      ) : null}
      {week >= 39 ? (
        <Path d={`M ${cx + 4 * k} ${cy + 8 * k} l ${5 * k} ${-4 * k} l ${4 * k} ${5 * k} l ${5 * k} ${-4 * k}`} stroke="#B98A5E" strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      ) : null}
    </G>
  );
}

function FrontLayer({ week, joys }: { week: number; joys: number }) {
  const stage = week < 8 ? 0 : week < 16 ? 1 : 2;
  return (
    <G>
      {stage === 0 ? (
        <G>
          <Line x1={70} y1={90} x2={124} y2={84} stroke="#9C6F47" strokeWidth={3} strokeLinecap="round" />
          <Line x1={78} y1={84} x2={132} y2={92} stroke="#B98A5E" strokeWidth={3} strokeLinecap="round" />
          <Line x1={86} y1={93} x2={118} y2={87} stroke="#9C6F47" strokeWidth={2.5} strokeLinecap="round" />
        </G>
      ) : stage === 1 ? (
        <G>
          <Path d="M 64 83 Q 100 116 136 83 Z" fill="#B98A5E" />
          <Path d="M 68 88 Q 100 99 132 88" stroke="#9C6F47" strokeWidth={2.5} fill="none" />
          <Line x1={60} y1={85} x2={74} y2={79} stroke="#9C6F47" strokeWidth={2.5} strokeLinecap="round" />
          <Line x1={140} y1={85} x2={127} y2={78} stroke="#9C6F47" strokeWidth={2.5} strokeLinecap="round" />
        </G>
      ) : (
        <G>
          <Path d="M 50 82 Q 100 132 150 82 Z" fill="#B98A5E" />
          <Path d="M 56 90 Q 100 104 144 90" stroke="#9C6F47" strokeWidth={2.5} fill="none" />
          <Path d="M 64 99 Q 100 112 136 99" stroke="#9C6F47" strokeWidth={2.5} fill="none" />
          <Line x1={46} y1={84} x2={62} y2={76} stroke="#9C6F47" strokeWidth={2.5} strokeLinecap="round" />
          <Line x1={154} y1={84} x2={138} y2={74} stroke="#9C6F47" strokeWidth={2.5} strokeLinecap="round" />
          {week >= 28 ? <Path d="M 54 83 Q 100 97 146 83 L 146 88 Q 100 102 54 88 Z" fill="#F29BB5" /> : null}
        </G>
      )}
      {Array.from({ length: Math.min(joys, 36) }).map((_, i) => <G key={i}><Keepsake i={i} /></G>)}
    </G>
  );
}

/** A still picture of the nest, for the look picker and the celebration. */
export function NestArt({ week, joys = 0, butterfly = false, width = 200, height }: Partial<NestProps> & { week: number; width?: number; height?: number }) {
  return (
    <Svg width={width} height={height ?? width * RATIO} viewBox={VB}>
      <BackLayer week={week} butterfly={butterfly} />
      <EggLayer week={week} peek={false} />
      <FrontLayer week={week} joys={joys} />
    </Svg>
  );
}

// ---------------------------------------------------------------- movement
type Move = { every: number; kind: "rock" | "shimmy" | "hop"; amount: number };

/** How often and how much the egg moves on its own. Still before week 20, then livelier toward the end. */
export function nestMove(week: number): Move | null {
  if (week < 20) return null;
  if (week < 28) return { every: 9000, kind: "rock", amount: 4 };
  if (week < 34) return { every: 5000, kind: "rock", amount: 8 };
  if (week < 37) return { every: 3500, kind: "shimmy", amount: 4 };
  if (week < 39) return { every: 2500, kind: "hop", amount: 6 };
  return { every: 1800, kind: "hop", amount: 7 };
}

/**
 * The living nest: the egg moves on its own (more often toward the end), wobbles when tapped,
 * and shows a peek inside while held.
 */
export function NestScene({ week, joys, butterfly, width, onPeek }: NestProps & { width: number; onPeek?: (peeking: boolean) => void }) {
  const height = width * RATIO;
  const scale = width / 200;
  const pivot = (EGG_BOTTOM - VB_CENTER_Y) * scale; // rock around the bottom of the egg
  const v = useRef(new Animated.Value(0)).current;
  const [move, setMove] = useState<Move>({ every: 0, kind: "rock", amount: 6 });
  const [peek, setPeek] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setStill);
    return () => sub.remove();
  }, []);

  const play = (m: Move) => {
    if (still) return;
    setMove(m);
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: m.kind === "shimmy" ? 600 : 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
  };

  useEffect(() => {
    const plan = nestMove(week);
    if (!plan || still || peek) return;
    const first = setTimeout(() => play(plan), 1200);
    const id = setInterval(() => play(plan), plan.every);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [week, still, peek]); // eslint-disable-line react-hooks/exhaustive-deps

  const a = move.amount;
  const rotate = move.kind === "rock"
    ? v.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: ["0deg", `${-a}deg`, `${a}deg`, `${-a * 0.6}deg`, `${a * 0.4}deg`, "0deg"] })
    : move.kind === "hop"
      ? v.interpolate({ inputRange: [0, 0.15, 0.3, 0.45, 0.6, 1], outputRange: ["0deg", "-6deg", "5deg", "-5deg", "3deg", "0deg"] })
      : "0deg";
  const shiftX = move.kind === "shimmy"
    ? v.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -a * scale, a * scale, -a * 0.5 * scale, 0] })
    : move.kind === "hop"
      ? v.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0, 3 * scale, -2 * scale, 0] })
      : 0;
  const shiftY = move.kind === "hop"
    ? v.interpolate({ inputRange: [0, 0.15, 0.3, 0.45, 0.6, 1], outputRange: [0, -a * scale, 0, -a * 0.6 * scale, 0, 0] })
    : 0;

  const setPeeking = (on: boolean) => { setPeek(on); onPeek?.(on); };

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={VB} style={{ position: "absolute" }}>
        <BackLayer week={week} butterfly={butterfly} />
      </Svg>
      <Animated.View
        style={{
          position: "absolute", width, height,
          transform: [{ translateY: pivot }, { rotate }, { translateY: -pivot }, { translateX: shiftX }, { translateY: shiftY }],
        }}
        pointerEvents="none"
      >
        <Svg width={width} height={height} viewBox={VB}>
          <EggLayer week={week} peek={peek} />
        </Svg>
      </Animated.View>
      <Svg width={width} height={height} viewBox={VB} style={{ position: "absolute" }} pointerEvents="none">
        <FrontLayer week={week} joys={joys} />
      </Svg>
      <Pressable
        style={{ position: "absolute", width, height }}
        onPress={() => play(nestMove(week) ?? { every: 0, kind: "rock", amount: 6 })}
        onLongPress={() => setPeeking(true)}
        onPressOut={() => { if (peek) setPeeking(false); }}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel="The egg. Tap to wiggle it, or press and hold to peek inside."
      />
    </View>
  );
}
