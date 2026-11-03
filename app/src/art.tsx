import React from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";
import type { LookName } from "./lib/looks";

// All drawings share a 200 x 120 canvas and are scaled to fit.
type Props = { width?: number; height?: number };
const box = (p: Props) => ({ width: p.width ?? 200, height: p.height ?? 120, viewBox: "0 0 200 120" });

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

// ---------------------------------------------------------------- Bloom
/** Seed (before week 8), sprout, leaves, bud (28), opening (33), full flower (37+). */
export function bloomStage(week: number): { stage: number; caption: string } {
  if (week < 8) return { stage: 0, caption: "A tiny seed is planted" };
  if (week < 16) return { stage: 1, caption: "A little sprout" };
  if (week < 24) return { stage: 2, caption: "New leaves" };
  if (week < 28) return { stage: 3, caption: "Growing tall" };
  if (week < 33) return { stage: 4, caption: "A bud is forming" };
  if (week < 37) return { stage: 5, caption: "Petals are opening" };
  return { stage: 6, caption: "In full bloom" };
}

function Leaf({ x, y, flip, size = 1 }: { x: number; y: number; flip?: boolean; size?: number }) {
  const d = flip ? `M ${x} ${y} q ${-14 * size} ${-12 * size} ${-26 * size} ${-4 * size} q ${12 * size} ${12 * size} ${26 * size} ${4 * size} Z`
                 : `M ${x} ${y} q ${14 * size} ${-12 * size} ${26 * size} ${-4 * size} q ${-12 * size} ${12 * size} ${-26 * size} ${4 * size} Z`;
  return <Path d={d} fill="#8DBE78" />;
}

function Flower({ x, y, open }: { x: number; y: number; open: number }) {
  // open: 0 = closed bud, 1 = half open, 2 = full
  if (open === 0) return <Ellipse cx={x} cy={y} rx={7} ry={11} fill="#F4A7B9" />;
  const petals = open === 1 ? 3 : 6;
  const r = open === 1 ? 8 : 11;
  return (
    <G>
      {Array.from({ length: petals }).map((_, i) => {
        const a = (open === 1 ? -90 + (i - 1) * 40 : i * 60) * (Math.PI / 180);
        return <Ellipse key={i} cx={x + Math.cos(a) * r} cy={y + Math.sin(a) * r} rx={8} ry={8} fill="#F4A7B9" />;
      })}
      <Circle cx={x} cy={y} r={open === 1 ? 5 : 7} fill="#FFE08A" />
    </G>
  );
}

export function BloomArt({ week, ...p }: Props & { week: number }) {
  const { stage } = bloomStage(week);
  const stemTop = [104, 92, 78, 62, 52, 46, 40][stage];
  return (
    <Svg {...box(p)}>
      <Ellipse cx={100} cy={108} rx={50} ry={10} fill="#C9A27E" />
      {stage === 0 ? <Ellipse cx={100} cy={101} rx={6} ry={4} fill="#8A6244" /> : null}
      {stage >= 1 ? <Path d={`M 100 106 Q 98 ${(106 + stemTop) / 2} 100 ${stemTop}`} stroke="#6E9A5E" strokeWidth={3} fill="none" strokeLinecap="round" /> : null}
      {stage >= 1 ? <><Leaf x={100} y={stage === 1 ? 94 : 96} size={stage === 1 ? 0.6 : 1} /><Leaf x={100} y={stage === 1 ? 94 : 96} flip size={stage === 1 ? 0.6 : 1} /></> : null}
      {stage >= 2 ? <><Leaf x={100} y={84} size={0.85} flip /><Leaf x={100} y={80} size={0.8} /></> : null}
      {stage >= 3 ? <><Leaf x={100} y={68} size={0.7} /><Leaf x={100} y={66} size={0.65} flip /></> : null}
      {stage >= 4 ? <Flower x={100} y={stemTop - 4} open={stage === 4 ? 0 : stage === 5 ? 1 : 2} /> : null}
      {stage === 6 ? <><Circle cx={66} cy={34} r={2} fill="#F4A7B9" /><Circle cx={136} cy={28} r={2.5} fill="#FFE08A" /><Circle cx={146} cy={52} r={1.8} fill="#F4A7B9" /></> : null}
    </Svg>
  );
}

// ---------------------------------------------------------------- Little nest
const SPECKLES: [number, number][] = [[94, 46], [106, 58], [90, 66], [110, 40], [100, 74], [86, 52], [114, 68], [98, 36], [104, 50], [92, 78]];

export function nestCaption(week: number): string {
  if (week >= 39) return "Crack, crack… almost time!";
  if (week >= 37) return "A tiny crack appeared";
  if (week >= 28) return "Getting a little wiggly in there";
  return "Safe and warm in the nest";
}

/** An egg in a nest; it gains speckles as the weeks go and cracks near the due date. */
export function NestArt({ week, ...p }: Props & { week: number }) {
  const speckles = clamp(Math.floor(week / 4), 0, SPECKLES.length);
  return (
    <Svg {...box(p)}>
      <Ellipse cx={100} cy={58} rx={24} ry={32} fill="#FFF8EE" stroke="#E9D3BA" strokeWidth={2} />
      {SPECKLES.slice(0, speckles).map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.6 : 2} fill="#E9B8A0" />)}
      {week >= 37 ? <Path d="M 84 52 l 6 -5 l 5 6 l 6 -6 l 5 5" stroke="#B98A5E" strokeWidth={1.8} fill="none" strokeLinejoin="round" /> : null}
      {week >= 39 ? <Path d="M 106 64 l 5 -4 l 4 5 l 5 -4" stroke="#B98A5E" strokeWidth={1.8} fill="none" strokeLinejoin="round" /> : null}
      <Path d="M 50 78 Q 100 130 150 78 Z" fill="#B98A5E" />
      <Path d="M 54 82 Q 100 96 146 82" stroke="#9C6F47" strokeWidth={3} fill="none" />
      <Path d="M 60 92 Q 100 106 140 92" stroke="#9C6F47" strokeWidth={3} fill="none" />
      <Path d="M 72 102 Q 100 112 128 102" stroke="#9C6F47" strokeWidth={2.5} fill="none" />
      <Line x1={46} y1={80} x2={62} y2={72} stroke="#9C6F47" strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={154} y1={80} x2={138} y2={70} stroke="#9C6F47" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------- Sky
export function SkyArt({ night, bg, ...p }: Props & { night: boolean; bg: string }) {
  if (night) {
    return (
      <Svg {...box(p)}>
        <Circle cx={100} cy={56} r={30} fill="#FFE7A3" />
        <Circle cx={114} cy={46} r={27} fill={bg} />
        {[[40, 30, 2.4], [62, 70, 1.6], [150, 28, 2.2], [168, 74, 1.8], [136, 96, 1.4], [30, 92, 1.8], [84, 18, 1.4], [178, 48, 1.2]].map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? "#FFFFFF" : "#FFE7A3"} />
        ))}
      </Svg>
    );
  }
  return (
    <Svg {...box(p)}>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        return <Line key={i} x1={100 + Math.cos(a) * 34} y1={56 + Math.sin(a) * 34} x2={100 + Math.cos(a) * 46} y2={56 + Math.sin(a) * 46} stroke="#FFC94A" strokeWidth={4} strokeLinecap="round" />;
      })}
      <Circle cx={100} cy={56} r={26} fill="#FFC94A" />
      <Cloud x={36} y={86} s={0.9} />
      <Cloud x={152} y={34} s={0.7} />
    </Svg>
  );
}

function Cloud({ x, y, s = 1, color = "#FFFFFF" }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <G>
      <Rect x={x - 26 * s} y={y - 6 * s} width={52 * s} height={18 * s} rx={9 * s} fill={color} />
      <Circle cx={x - 8 * s} cy={y - 6 * s} r={12 * s} fill={color} />
      <Circle cx={x + 10 * s} cy={y - 4 * s} r={9 * s} fill={color} />
    </G>
  );
}

// ---------------------------------------------------------------- Storybook (after birth)
export function storybookCaption(months: number): string {
  if (months < 1) return "A brand-new seedling";
  if (months < 6) return "Growing a little every day";
  if (months < 12) return "Getting taller and stronger";
  return "A whole year of growing";
}

/** Clouds and a little seedling in a pot that grows month by month; it flowers at the first birthday. */
export function StorybookArt({ months, ...p }: Props & { months: number }) {
  const m = clamp(months, 0, 12);
  const top = 82 - m * 3.6; // stem gets taller each month
  const pairs = 1 + Math.floor(m / 4);
  return (
    <Svg {...box(p)}>
      <Cloud x={42} y={30} s={0.9} />
      <Cloud x={160} y={44} s={0.75} />
      <Path d={`M 100 92 Q 97 ${(92 + top) / 2} 100 ${top}`} stroke="#5FA57E" strokeWidth={3} fill="none" strokeLinecap="round" />
      {Array.from({ length: pairs }).map((_, i) => {
        const y = 88 - i * 12;
        return <G key={i}><Leaf x={100} y={y} size={0.7 - i * 0.08} /><Leaf x={100} y={y - 2} size={0.7 - i * 0.08} flip /></G>;
      })}
      {m >= 12 ? <Flower x={100} y={top - 4} open={2} /> : null}
      <Path d="M 80 92 L 120 92 L 114 114 L 86 114 Z" fill="#F29BB5" />
      <Rect x={77} y={88} width={46} height={7} rx={3} fill="#E8708F" />
    </Svg>
  );
}

// ---------------------------------------------------------------- Little friend (after birth)
/** A chick that hatched from the nest: fluffier each month, wings up at the first birthday. */
export function FriendArt({ months, ...p }: Props & { months: number }) {
  const m = clamp(months, 0, 12);
  const wing = 10 + m * 0.9;
  const tufts = 1 + Math.min(3, Math.floor(m / 3));
  const flying = m >= 12;
  return (
    <Svg {...box(p)}>
      {m < 1 ? (
        <G>
          <Path d="M 66 104 l 8 -10 l 6 8 l 8 -9 l 6 11 Z" fill="#FFF8EE" stroke="#E9D3BA" strokeWidth={1.5} />
          <Path d="M 108 104 l 6 -9 l 7 8 l 7 -10 l 7 11 Z" fill="#FFF8EE" stroke="#E9D3BA" strokeWidth={1.5} />
        </G>
      ) : null}
      {Array.from({ length: tufts }).map((_, i) => (
        <Path key={i} d={`M ${96 + i * 4} 30 q ${-4 + i * 3} -10 ${2 + i * 2} -14`} stroke="#E9A92E" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      ))}
      <Ellipse cx={100 - 30} cy={flying ? 50 : 70} rx={wing * 0.55} ry={wing} fill="#F1B53A" transform={flying ? "rotate(-35 70 50)" : undefined} />
      <Ellipse cx={100 + 30} cy={flying ? 50 : 70} rx={wing * 0.55} ry={wing} fill="#F1B53A" transform={flying ? "rotate(35 130 50)" : undefined} />
      <Circle cx={100} cy={64} r={34} fill="#F7C548" />
      <Ellipse cx={100} cy={78} rx={20} ry={14} fill="#FCE28F" />
      <Circle cx={88} cy={56} r={3.6} fill="#4A2A1E" />
      <Circle cx={112} cy={56} r={3.6} fill="#4A2A1E" />
      <Circle cx={89.2} cy={54.8} r={1.1} fill="#FFFFFF" />
      <Circle cx={113.2} cy={54.8} r={1.1} fill="#FFFFFF" />
      <Path d="M 94 63 L 106 63 L 100 71 Z" fill="#F08A3C" />
      <Ellipse cx={80} cy={66} rx={5} ry={3} fill="#F4A0A0" />
      <Ellipse cx={120} cy={66} rx={5} ry={3} fill="#F4A0A0" />
      <Line x1={92} y1={97} x2={90} y2={108} stroke="#F08A3C" strokeWidth={3} strokeLinecap="round" />
      <Line x1={108} y1={97} x2={110} y2={108} stroke="#F08A3C" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/** The drawing for a look at a given point in the journey, or null for Calm. */
export function LookArt({ look, week, months, night, bg, ...p }: Props & { look: LookName; week: number; months: number; night: boolean; bg: string }) {
  switch (look) {
    case "bloom": return <BloomArt week={week} {...p} />;
    case "nest": return <NestArt week={week} {...p} />;
    case "sky": return <SkyArt night={night} bg={bg} {...p} />;
    case "storybook": return <StorybookArt months={months} {...p} />;
    case "friend": return <FriendArt months={months} {...p} />;
    default: return null;
  }
}
