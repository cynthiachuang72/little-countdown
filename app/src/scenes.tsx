import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";
import Svg from "react-native-svg";
import {
  Bee, BLOOM_PIVOT, BloomBase, bloomHead, BloomPlant, BloomSparkles, FriendBody, FriendEyes, FriendEyesClosed, FriendShells,
  FriendWing, LITTLE_STAR, Petal, ShootingStar, SkyCloudA, SkyCloudB, SkyMoon, SkyRays, SkyStars, SkySun, SkySunFace, SleepyZ,
  StarlightDayBack, StarlightDayStar, StarlightHeartStars, StarlightNightBack, StarlightNightStar, STORY_PIVOT, StoryCloudA,
  StoryCloudB, StoryDrops, StoryPlant, StoryPot, StoryRainCloud, SUN_CENTER, WING_PIVOTS,
} from "./art";
import type { LookName } from "./lib/looks";

// Moving versions of the illustrated looks. Each scene stacks full-size layers drawn on the same
// 200 x 120 canvas and moves some of them: gentle loops all the time, plus a reaction when tapped.
// Everything holds still when Reduce Motion is on.

type AV = InstanceType<typeof Animated.Value>;
type Anim = ReturnType<AV["interpolate"]> | AV | number | string;
type Transform = Record<string, Anim>;

/** True when the phone asks for less motion. */
export function useStill(): boolean {
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setStill);
    return () => sub.remove();
  }, []);
  return still;
}

/** A value that runs 0 → 1 over `ms` again and again (stopped at 0 when `run` is false). */
function useLoop(ms: number, run: boolean, delay = 0): AV {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!run) { v.setValue(0); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.linear, useNativeDriver: true }),
    ]), { resetBeforeIteration: true });
    a.start();
    return () => a.stop();
  }, [ms, run, delay]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

/** A value that runs 0 → 1 once each time `trigger` changes (skipped on the first render and when still). */
function useOnce(trigger: number, ms: number, still: boolean): AV {
  const v = useRef(new Animated.Value(0)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (still) return;
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

/** Ticks up every `ms` while `run` is true; used for things that happen on their own now and then. */
function useEvery(ms: number, run: boolean): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setN((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms, run]);
  return n;
}

/** A smooth back-and-forth from a 0 → 1 loop: 0 → +a → 0 → -a → 0. */
const wave = (v: AV, a: number, unit = "") =>
  v.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: unit ? ["0" + unit, a + unit, "0" + unit, -a + unit, "0" + unit] : [0, a, 0, -a, 0] }) as Anim;

/** Transforms that turn or scale a layer around a point on the 200 x 120 canvas. */
function about([px, py]: [number, number], s: number, inner: Transform[]): Transform[] {
  const dx = (px - 100) * s, dy = (py - 60) * s;
  return [{ translateX: dx }, { translateY: dy }, ...inner, { translateX: -dx }, { translateY: -dy }];
}

function Layer({ w, children, style }: { w: number; children: React.ReactNode; style?: object }) {
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", width: w, height: w * 0.6 }, style]}>
      <Svg width={w} height={w * 0.6} viewBox="0 0 200 120">{children}</Svg>
    </Animated.View>
  );
}

type SceneProps = { w: number; tap: number; still: boolean };

// ---------------------------------------------------------------- Bloom
function BloomScene({ w, tap, still, week, milestone }: SceneProps & { week: number; milestone: boolean }) {
  const s = w / 200;
  const sway = useLoop(4200, !still);
  const fall = useOnce(tap, 1700, still);
  const auto = useEvery(9000, milestone && !still);
  const bee = useOnce(tap * 1000 + auto, 2200, still);
  const [hx, hy] = bloomHead(week);
  return (
    <View style={{ width: w, height: w * 0.6 }}>
      <Layer w={w}><BloomBase week={week} /></Layer>
      <Layer w={w} style={{ transform: about(BLOOM_PIVOT, s, [{ rotate: wave(sway, 3, "deg") }]) }}><BloomPlant week={week} /></Layer>
      <Layer w={w}><BloomSparkles week={week} /></Layer>
      <Layer w={w} style={{
        opacity: fall.interpolate({ inputRange: [0, 0.05, 0.8, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: (hx + 10 - 100) * s }, { translateY: (hy - 60) * s },
          { translateX: fall.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 14 * s, -10 * s] }) },
          { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, (104 - hy) * s] }) },
          { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "200deg"] }) },
          { translateX: 100 * s }, { translateY: 60 * s },
        ],
      }}><Petal /></Layer>
      <Layer w={w} style={{
        opacity: bee.interpolate({ inputRange: [0, 0.02, 0.95, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: bee.interpolate({ inputRange: [0, 1], outputRange: [-20 * s, 220 * s] }) },
          { translateY: bee.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [40 * s, 24 * s, 46 * s, 22 * s, 40 * s, 26 * s] }) },
        ],
      }}><Bee /></Layer>
    </View>
  );
}

// ---------------------------------------------------------------- Sky
function SkyScene({ w, tap, still, night, bg }: SceneProps & { night: boolean; bg: string }) {
  const s = w / 200;
  const turn = useLoop(20000, !still && !night);
  const driftA = useLoop(12000, !still && !night);
  const driftB = useLoop(16000, !still && !night);
  const twinkle = useLoop(2600, !still && night);
  const smile = useOnce(night ? 0 : tap, 1800, still);
  const auto = useEvery(13000, night && !still);
  const shoot = useOnce(night ? tap * 1000 + auto : 0, 1200, still);
  if (night) {
    return (
      <View style={{ width: w, height: w * 0.6 }}>
        <Layer w={w}><SkyMoon bg={bg} /></Layer>
        <Layer w={w} style={{ opacity: twinkle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.3, 1] }) }}><SkyStars set={0} /></Layer>
        <Layer w={w} style={{ opacity: twinkle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 1, 0.35] }) }}><SkyStars set={1} /></Layer>
        <ShootingLayer w={w} v={shoot} />
      </View>
    );
  }
  return (
    <View style={{ width: w, height: w * 0.6 }}>
      <Layer w={w} style={{ transform: about(SUN_CENTER, s, [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }]) }}><SkyRays /></Layer>
      <Layer w={w} style={{ transform: about(SUN_CENTER, s, [{ scale: smile.interpolate({ inputRange: [0, 0.15, 0.3, 1], outputRange: [1, 1.08, 1, 1] }) }]) }}><SkySun /></Layer>
      <Layer w={w} style={{ opacity: smile.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }) }}><SkySunFace /></Layer>
      <Layer w={w} style={{ transform: [{ translateX: wave(driftA, 12 * s) }] }}><SkyCloudA /></Layer>
      <Layer w={w} style={{ transform: [{ translateX: wave(driftB, -10 * s) }] }}><SkyCloudB /></Layer>
    </View>
  );
}

function ShootingLayer({ w, v }: { w: number; v: AV }) {
  const s = w / 200;
  return (
    <Layer w={w} style={{
      opacity: v.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
      transform: [
        { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, -120 * s] }) },
        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 66 * s] }) },
      ],
    }}><ShootingStar /></Layer>
  );
}

// ---------------------------------------------------------------- Storybook
function StoryScene({ w, tap, still, months }: SceneProps & { months: number }) {
  const s = w / 200;
  const sway = useLoop(4600, !still);
  const driftA = useLoop(13000, !still);
  const driftB = useLoop(17000, !still);
  const water = useOnce(tap, 1800, still);
  return (
    <View style={{ width: w, height: w * 0.6 }}>
      <Layer w={w} style={{ transform: [{ translateX: wave(driftA, 10 * s) }] }}><StoryCloudA /></Layer>
      <Layer w={w} style={{ transform: [{ translateX: wave(driftB, -8 * s) }] }}><StoryCloudB /></Layer>
      <Layer w={w} style={{ opacity: water.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }) }}><StoryRainCloud /></Layer>
      <Layer w={w} style={{
        opacity: water.interpolate({ inputRange: [0, 0.15, 0.3, 0.55, 0.6, 1], outputRange: [0, 0, 1, 1, 0, 0] }),
        transform: [{ translateY: water.interpolate({ inputRange: [0, 0.15, 0.6, 1], outputRange: [0, 0, 34 * s, 34 * s] }) }],
      }}><StoryDrops /></Layer>
      <Layer w={w} style={{
        transform: about(STORY_PIVOT, s, [
          { rotate: wave(sway, 2.5, "deg") },
          { scale: water.interpolate({ inputRange: [0, 0.55, 0.7, 0.85, 1], outputRange: [1, 1, 1.1, 0.98, 1] }) },
        ]),
      }}><StoryPlant months={months} /></Layer>
      <Layer w={w}><StoryPot /></Layer>
    </View>
  );
}

// ---------------------------------------------------------------- Little friend
function FriendScene({ w, tap, still, months }: SceneProps & { months: number }) {
  const s = w / 200;
  const bob = useLoop(2600, !still);
  const blink = useLoop(4200, !still);
  const flap = useLoop(5200, !still, 700);
  const hop = useOnce(tap, 750, still);
  const flapDeg = (side: 0 | 1) => flap.interpolate({
    inputRange: [0, 0.78, 0.83, 0.88, 0.93, 1],
    outputRange: side ? ["0deg", "0deg", "22deg", "0deg", "22deg", "0deg"] : ["0deg", "0deg", "-22deg", "0deg", "-22deg", "0deg"],
  });
  return (
    <View style={{ width: w, height: w * 0.6 }}>
      <Layer w={w}><FriendShells months={months} /></Layer>
      <Animated.View pointerEvents="none" style={{
        position: "absolute", width: w, height: w * 0.6,
        transform: [
          { translateY: wave(bob, -3 * s) },
          { translateY: hop.interpolate({ inputRange: [0, 0.4, 0.7, 0.85, 1], outputRange: [0, -16 * s, 0, -5 * s, 0] }) },
        ],
      } as object}>
        <Layer w={w} style={{ transform: about(WING_PIVOTS[0], s, [{ rotate: flapDeg(0) }]) }}><FriendWing side={0} months={months} /></Layer>
        <Layer w={w} style={{ transform: about(WING_PIVOTS[1], s, [{ rotate: flapDeg(1) }]) }}><FriendWing side={1} months={months} /></Layer>
        <Layer w={w}><FriendBody months={months} /><FriendEyes /></Layer>
        <Layer w={w} style={{ opacity: blink.interpolate({ inputRange: [0, 0.9, 0.92, 0.96, 1], outputRange: [0, 0, 1, 0, 0] }) }}><FriendEyesClosed /></Layer>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------- Starlight
function StarlightScene({ w, tap, still, months, night, bg }: SceneProps & { months: number; night: boolean; bg: string }) {
  const s = w / 200;
  const breathe = useLoop(3600, !still);
  const twinkle = useLoop(2400, !still && night);
  const z = useLoop(3200, !still && !night);
  const bounce = useOnce(night ? 0 : tap, 700, still);
  const auto = useEvery(14000, night && !still);
  const shoot = useOnce(night ? tap * 1000 + auto : 0, 1200, still);
  const breatheScale = breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.06, 1] });
  if (night) {
    return (
      <View style={{ width: w, height: w * 0.6 }}>
        <Layer w={w}><StarlightNightBack months={months} bg={bg} /></Layer>
        <Layer w={w} style={{ opacity: twinkle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.4, 1] }) }}><StarlightHeartStars months={months} set={0} /></Layer>
        <Layer w={w} style={{ opacity: twinkle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.45, 1, 0.45] }) }}><StarlightHeartStars months={months} set={1} /></Layer>
        <Layer w={w} style={{ transform: about(LITTLE_STAR.night, s, [{ scale: breatheScale }]) }}><StarlightNightStar /></Layer>
        <ShootingLayer w={w} v={shoot} />
      </View>
    );
  }
  return (
    <View style={{ width: w, height: w * 0.6 }}>
      <Layer w={w}><StarlightDayBack /></Layer>
      <Layer w={w} style={{
        transform: about(LITTLE_STAR.day, s, [
          { scale: breatheScale },
          { translateY: bounce.interpolate({ inputRange: [0, 0.4, 0.7, 1], outputRange: [0, -10 * s, 0, 0] }) },
        ]),
      }}><StarlightDayStar /></Layer>
      <Layer w={w} style={{
        opacity: z.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
        transform: [{ translateX: z.interpolate({ inputRange: [0, 1], outputRange: [0, 10 * s] }) }, { translateY: z.interpolate({ inputRange: [0, 1], outputRange: [0, -16 * s] }) }],
      }}><SleepyZ /></Layer>
    </View>
  );
}

/**
 * The moving drawing for an illustrated look (not Little nest, which has its own scene, or Calm).
 * Bump `tap` to play the tap reaction.
 */
export function LookScene({ look, width, tap, week, months, night, bg, milestone }: {
  look: LookName; width: number; tap: number; week: number; months: number; night: boolean; bg: string; milestone: boolean;
}) {
  const still = useStill();
  const p = { w: width, tap, still };
  switch (look) {
    case "bloom": return <BloomScene {...p} week={week} milestone={milestone} />;
    case "sky": return <SkyScene {...p} night={night} bg={bg} />;
    case "storybook": return <StoryScene {...p} months={months} />;
    case "friend": return <FriendScene {...p} months={months} />;
    case "starlight": return <StarlightScene {...p} months={months} night={night} bg={bg} />;
    default: return null;
  }
}

// ---------------------------------------------------------------- Calm
/** A number that counts up from zero when it first appears (Calm), then just shows the value. */
export function CountUp({ value, animate }: { value: number; animate: boolean }) {
  const still = useStill();
  const [shown, setShown] = useState(animate ? 0 : value);
  const done = useRef(!animate);
  useEffect(() => {
    if (done.current || still) { done.current = true; setShown(value); return; }
    const start = Date.now();
    let raf = 0;
    const step = () => {
      const p = Math.min(1, (Date.now() - start) / 900);
      setShown(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
      else done.current = true;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, still]);
  return <>{shown}</>;
}

/** A dot that gently breathes in and out (the "today" marker in Calm). */
export function BreathingDot({ run, style }: { run: boolean; style: object }) {
  const still = useStill();
  const v = useLoop(2600, run && !still);
  return (
    <Animated.View
      style={[style, { transform: [{ scale: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] }) }] }]}
    />
  );
}
