import React from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import type { LookName } from "./lib/looks";
import { NestArt } from "./nest";

// All drawings share a 200 x 120 canvas and are scaled to fit.
// Each look is split into layers (functions that return SVG shapes) so scenes.tsx can move parts on their own.
// The still versions below put every layer into one picture, for the look picker and the celebration.
type Props = { width?: number; height?: number };
const box = (p: Props) => ({ width: p.width ?? 200, height: p.height ?? 120, viewBox: "0 0 200 120" });

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

// ---------------------------------------------------------------- shared pieces
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

export function Cloud({ x, y, s = 1, color = "#FFFFFF" }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <G>
      <Rect x={x - 26 * s} y={y - 6 * s} width={52 * s} height={18 * s} rx={9 * s} fill={color} />
      <Circle cx={x - 8 * s} cy={y - 6 * s} r={12 * s} fill={color} />
      <Circle cx={x + 10 * s} cy={y - 4 * s} r={9 * s} fill={color} />
    </G>
  );
}

export function starPath(cx: number, cy: number, R: number, r: number): string {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const rad = i % 2 ? r : R;
    d += `${i ? "L" : "M"} ${(cx + Math.cos(a) * rad).toFixed(1)} ${(cy + Math.sin(a) * rad).toFixed(1)} `;
  }
  return d + "Z";
}

/** A shooting star, drawn at the top right; scenes slide it down to the left. */
export function ShootingStar() {
  return (
    <G>
      <Line x1={186} y1={10} x2={168} y2={20} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <Line x1={176} y1={15} x2={160} y2={24} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" opacity={0.35} />
      <Path d={starPath(188, 9, 4, 1.8)} fill="#FFFFFF" />
    </G>
  );
}

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
const STEM_TOP = [104, 92, 78, 62, 52, 46, 40];
export const BLOOM_PIVOT: [number, number] = [100, 106];
/** Where the flower head is, so a petal can fall from it. */
export const bloomHead = (week: number): [number, number] => [100, STEM_TOP[bloomStage(week).stage] - 4];

export function BloomBase({ week }: { week: number }) {
  const { stage } = bloomStage(week);
  return (
    <G>
      <Ellipse cx={100} cy={108} rx={50} ry={10} fill="#C9A27E" />
      {stage === 0 ? <Ellipse cx={100} cy={101} rx={6} ry={4} fill="#8A6244" /> : null}
    </G>
  );
}

export function BloomPlant({ week }: { week: number }) {
  const { stage } = bloomStage(week);
  const stemTop = STEM_TOP[stage];
  if (stage === 0) return null;
  return (
    <G>
      <Path d={`M 100 106 Q 98 ${(106 + stemTop) / 2} 100 ${stemTop}`} stroke="#6E9A5E" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Leaf x={100} y={stage === 1 ? 94 : 96} size={stage === 1 ? 0.6 : 1} />
      <Leaf x={100} y={stage === 1 ? 94 : 96} flip size={stage === 1 ? 0.6 : 1} />
      {stage >= 2 ? <><Leaf x={100} y={84} size={0.85} flip /><Leaf x={100} y={80} size={0.8} /></> : null}
      {stage >= 3 ? <><Leaf x={100} y={68} size={0.7} /><Leaf x={100} y={66} size={0.65} flip /></> : null}
      {stage >= 4 ? <Flower x={100} y={stemTop - 4} open={stage === 4 ? 0 : stage === 5 ? 1 : 2} /> : null}
    </G>
  );
}

export function BloomSparkles({ week }: { week: number }) {
  if (bloomStage(week).stage < 6) return null;
  return <G><Circle cx={66} cy={34} r={2} fill="#F4A7B9" /><Circle cx={136} cy={28} r={2.5} fill="#FFE08A" /><Circle cx={146} cy={52} r={1.8} fill="#F4A7B9" /></G>;
}

/** A falling petal, drawn at the canvas origin; scenes move it into place. */
export function Petal() {
  return <Ellipse cx={0} cy={0} rx={6} ry={4} fill="#F4A7B9" />;
}

/** A little bee, drawn at the canvas origin; scenes fly it across. */
export function Bee() {
  return (
    <G>
      <Ellipse cx={-2} cy={-7} rx={4.5} ry={3.2} fill="#FFFFFF" opacity={0.85} />
      <Ellipse cx={3} cy={-7} rx={4} ry={3} fill="#FFFFFF" opacity={0.85} />
      <Ellipse cx={0} cy={0} rx={7} ry={5} fill="#F7C548" />
      <Line x1={-2} y1={-4.5} x2={-2} y2={4.5} stroke="#4A2A1E" strokeWidth={1.6} />
      <Line x1={2.5} y1={-4.5} x2={2.5} y2={4.5} stroke="#4A2A1E" strokeWidth={1.6} />
      <Circle cx={6} cy={-1} r={1} fill="#4A2A1E" />
    </G>
  );
}

export function BloomArt({ week, ...p }: Props & { week: number }) {
  return (
    <Svg {...box(p)}>
      <BloomBase week={week} />
      <BloomPlant week={week} />
      <BloomSparkles week={week} />
    </Svg>
  );
}

// The Little nest drawing lives in nest.tsx (it has its own moving egg).
export { nestCaption } from "./nest";

// ---------------------------------------------------------------- Sky
export const SUN_CENTER: [number, number] = [100, 56];
const NIGHT_STARS: [number, number, number][] = [[40, 30, 2.4], [62, 70, 1.6], [150, 28, 2.2], [168, 74, 1.8], [136, 96, 1.4], [30, 92, 1.8], [84, 18, 1.4], [178, 48, 1.2]];

export function SkyRays() {
  return (
    <G>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        return <Line key={i} x1={100 + Math.cos(a) * 34} y1={56 + Math.sin(a) * 34} x2={100 + Math.cos(a) * 46} y2={56 + Math.sin(a) * 46} stroke="#FFC94A" strokeWidth={4} strokeLinecap="round" />;
      })}
    </G>
  );
}
export function SkySun() {
  return <Circle cx={100} cy={56} r={26} fill="#FFC94A" />;
}
/** The sun's smile, shown briefly when tapped. */
export function SkySunFace() {
  return (
    <G>
      <Circle cx={91} cy={50} r={2.4} fill="#B8701A" />
      <Circle cx={109} cy={50} r={2.4} fill="#B8701A" />
      <Path d="M 89 60 q 11 10 22 0" stroke="#B8701A" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Ellipse cx={84} cy={58} rx={4} ry={2.4} fill="#F4A0A0" />
      <Ellipse cx={116} cy={58} rx={4} ry={2.4} fill="#F4A0A0" />
    </G>
  );
}
export function SkyCloudA() { return <Cloud x={36} y={86} s={0.9} />; }
export function SkyCloudB() { return <Cloud x={152} y={34} s={0.7} />; }
export function SkyMoon({ bg }: { bg: string }) {
  return <G><Circle cx={100} cy={56} r={30} fill="#FFE7A3" /><Circle cx={114} cy={46} r={27} fill={bg} /></G>;
}
/** Night stars, split into two sets that twinkle out of step. */
export function SkyStars({ set }: { set: 0 | 1 }) {
  return (
    <G>
      {NIGHT_STARS.filter((_, i) => i % 2 === set).map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill={set ? "#FFFFFF" : "#FFE7A3"} />)}
    </G>
  );
}

export function SkyArt({ night, bg, ...p }: Props & { night: boolean; bg: string }) {
  if (night) return <Svg {...box(p)}><SkyMoon bg={bg} /><SkyStars set={0} /><SkyStars set={1} /></Svg>;
  return <Svg {...box(p)}><SkyRays /><SkySun /><SkyCloudA /><SkyCloudB /></Svg>;
}

// ---------------------------------------------------------------- Storybook (after birth)
export function storybookCaption(months: number): string {
  if (months < 1) return "A brand-new seedling";
  if (months < 6) return "Growing a little every day";
  if (months < 12) return "Getting taller and stronger";
  return "A whole year of growing";
}
export const STORY_PIVOT: [number, number] = [100, 92];

export function StoryCloudA() { return <Cloud x={42} y={30} s={0.9} />; }
export function StoryCloudB() { return <Cloud x={160} y={44} s={0.75} />; }
export function StoryPlant({ months }: { months: number }) {
  const m = clamp(months, 0, 12);
  const top = 82 - m * 3.6; // stem gets taller each month
  const pairs = 1 + Math.floor(m / 4);
  return (
    <G>
      <Path d={`M 100 92 Q 97 ${(92 + top) / 2} 100 ${top}`} stroke="#5FA57E" strokeWidth={3} fill="none" strokeLinecap="round" />
      {Array.from({ length: pairs }).map((_, i) => {
        const y = 88 - i * 12;
        return <G key={i}><Leaf x={100} y={y} size={0.7 - i * 0.08} /><Leaf x={100} y={y - 2} size={0.7 - i * 0.08} flip /></G>;
      })}
      {m >= 12 ? <Flower x={100} y={top - 4} open={2} /> : null}
    </G>
  );
}
export function StoryPot() {
  return <G><Path d="M 80 92 L 120 92 L 114 114 L 86 114 Z" fill="#F29BB5" /><Rect x={77} y={88} width={46} height={7} rx={3} fill="#E8708F" /></G>;
}
/** A small rain cloud that waters the seedling when tapped. */
export function StoryRainCloud() {
  return <Cloud x={100} y={22} s={0.8} color="#FFFFFF" />;
}
export function StoryDrops() {
  return <G>{[86, 96, 106, 116].map((x, i) => <Ellipse key={i} cx={x} cy={38 + (i % 2) * 6} rx={1.8} ry={3.2} fill="#7FB6E0" />)}</G>;
}

export function StorybookArt({ months, ...p }: Props & { months: number }) {
  return <Svg {...box(p)}><StoryCloudA /><StoryCloudB /><StoryPlant months={months} /><StoryPot /></Svg>;
}

// ---------------------------------------------------------------- Little friend (after birth)
const wingSize = (months: number) => 10 + clamp(months, 0, 12) * 0.9;
const flying = (months: number) => months >= 12;
export const WING_PIVOTS: [[number, number], [number, number]] = [[76, 62], [124, 62]];

export function FriendShells({ months }: { months: number }) {
  if (months >= 1) return null;
  return (
    <G>
      <Path d="M 66 104 l 8 -10 l 6 8 l 8 -9 l 6 11 Z" fill="#FFF8EE" stroke="#E9D3BA" strokeWidth={1.5} />
      <Path d="M 108 104 l 6 -9 l 7 8 l 7 -10 l 7 11 Z" fill="#FFF8EE" stroke="#E9D3BA" strokeWidth={1.5} />
    </G>
  );
}
export function FriendWing({ side, months }: { side: 0 | 1; months: number }) {
  const w = wingSize(months), up = flying(months);
  const cx = side ? 130 : 70, cy = up ? 50 : 70;
  return <Ellipse cx={cx} cy={cy} rx={w * 0.55} ry={w} fill="#F1B53A" transform={up ? `rotate(${side ? 35 : -35} ${cx} 50)` : undefined} />;
}
export function FriendBody({ months }: { months: number }) {
  const tufts = 1 + Math.min(3, Math.floor(clamp(months, 0, 12) / 3));
  return (
    <G>
      {Array.from({ length: tufts }).map((_, i) => (
        <Path key={i} d={`M ${96 + i * 4} 30 q ${-4 + i * 3} -10 ${2 + i * 2} -14`} stroke="#E9A92E" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      ))}
      <Circle cx={100} cy={64} r={34} fill="#F7C548" />
      <Ellipse cx={100} cy={78} rx={20} ry={14} fill="#FCE28F" />
      <Path d="M 94 63 L 106 63 L 100 71 Z" fill="#F08A3C" />
      <Ellipse cx={80} cy={66} rx={5} ry={3} fill="#F4A0A0" />
      <Ellipse cx={120} cy={66} rx={5} ry={3} fill="#F4A0A0" />
      <Line x1={92} y1={97} x2={90} y2={108} stroke="#F08A3C" strokeWidth={3} strokeLinecap="round" />
      <Line x1={108} y1={97} x2={110} y2={108} stroke="#F08A3C" strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}
export function FriendEyes() {
  return (
    <G>
      <Circle cx={88} cy={56} r={3.6} fill="#4A2A1E" />
      <Circle cx={112} cy={56} r={3.6} fill="#4A2A1E" />
      <Circle cx={89.2} cy={54.8} r={1.1} fill="#FFFFFF" />
      <Circle cx={113.2} cy={54.8} r={1.1} fill="#FFFFFF" />
    </G>
  );
}
/** Closed eyes, laid over the open ones for a blink. */
export function FriendEyesClosed() {
  return (
    <G>
      <Circle cx={88} cy={56} r={4.4} fill="#F7C548" />
      <Circle cx={112} cy={56} r={4.4} fill="#F7C548" />
      <Path d="M 84 56 q 4 3 8 0 M 108 56 q 4 3 8 0" stroke="#4A2A1E" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </G>
  );
}

/** A chick that hatched from the nest: fluffier each month, wings up at the first birthday. */
export function FriendArt({ months, ...p }: Props & { months: number }) {
  return (
    <Svg {...box(p)}>
      <FriendShells months={months} />
      <FriendWing side={0} months={months} />
      <FriendWing side={1} months={months} />
      <FriendBody months={months} />
      <FriendEyes />
    </Svg>
  );
}

// ---------------------------------------------------------------- Starlight (after birth, follows Sky)
/** 12 points spaced evenly around a heart, starting at the bottom tip; one lights up each month. */
const HEART: [number, number][] = (() => {
  const pt = (t: number): [number, number] => {
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [134 + x * 2.3, 54 - y * 2.3];
  };
  const fine = Array.from({ length: 721 }, (_, i) => pt(Math.PI + (2 * Math.PI * i) / 720));
  const cum = [0];
  for (let i = 1; i < fine.length; i++) cum.push(cum[i - 1] + Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1]));
  const total = cum[cum.length - 1];
  return Array.from({ length: 12 }, (_, k) => fine[cum.findIndex((d) => d >= (total * k) / 12)]);
})();

export function starlightCaption(months: number, night: boolean, name: string): string {
  const who = name || "baby";
  const m = clamp(months, 0, 12);
  if (!night) return m >= 12 ? `${who}'s heart of stars is complete` : "Your little star is napping on a cloud";
  if (m === 0) return "A new little star in the sky";
  if (m >= 12) return `A whole heart of stars for ${who}`;
  return `${m} ${m === 1 ? "star" : "stars"} in ${who}'s sky`;
}

/** Where the little star sits, so it can breathe around its own center. */
export const LITTLE_STAR = { day: [70, 60] as [number, number], night: [70, 80] as [number, number] };

export function StarlightDayBack() {
  return <G><Circle cx={158} cy={32} r={18} fill="#FFC94A" /><Cloud x={70} y={84} s={1.3} /><Cloud x={160} y={88} s={0.7} /></G>;
}
export function StarlightDayStar() {
  return (
    <G>
      <Path d={starPath(70, 60, 17, 7.8)} fill="#FFE7A3" stroke="#F2B544" strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M 63 61 q 2.4 2.4 4.8 0 M 72 61 q 2.4 2.4 4.8 0" stroke="#5B4A2A" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Ellipse cx={61} cy={66} rx={2.6} ry={1.5} fill="#F4A7B9" />
      <Ellipse cx={79} cy={66} rx={2.6} ry={1.5} fill="#F4A7B9" />
    </G>
  );
}
/** A floating "z" for the napping star; scenes drift it up and fade it. */
export function SleepyZ() {
  return <SvgText x={88} y={48} fontSize={11} fontWeight="bold" fill="#5B7593">z</SvgText>;
}
export function StarlightNightBack({ months, bg }: { months: number; bg: string }) {
  const m = clamp(months, 0, 12);
  const lit = HEART.slice(0, m);
  const line = lit.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + (m >= 12 ? " Z" : "");
  return (
    <G>
      <Circle cx={46} cy={44} r={22} fill="#FFE7A3" />
      <Circle cx={57} cy={36} r={20} fill={bg} />
      {[[20, 96, 1.4], [92, 16, 1.2], [186, 100, 1.3], [104, 104, 1.1], [12, 30, 1.2]].map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" />)}
      {m >= 2 ? <Path d={line} stroke="#FFE7A3" strokeWidth={1.2} fill="none" opacity={0.55} /> : null}
      {HEART.map(([x, y], i) => (i >= m ? <Circle key={i} cx={x} cy={y} r={1.1} fill="#B9B6E8" opacity={0.35} /> : null))}
    </G>
  );
}
/** baby's month stars, split into two sets that twinkle out of step. */
export function StarlightHeartStars({ months, set }: { months: number; set: 0 | 1 }) {
  const m = clamp(months, 0, 12);
  return (
    <G>
      {HEART.map(([x, y], i) => (i < m && i % 2 === set
        ? <Path key={i} d={starPath(x, y, m >= 12 ? 4.8 : 4.2, m >= 12 ? 2.2 : 1.9)} fill="#FFE7A3" />
        : null))}
    </G>
  );
}
export function StarlightNightStar() {
  return (
    <G>
      <Path d={starPath(70, 80, 10, 4.6)} fill="#FFE7A3" />
      <Path d="M 66 81 q 1.5 1.5 3 0 M 71 81 q 1.5 1.5 3 0" stroke="#5B4A2A" strokeWidth={1.1} fill="none" strokeLinecap="round" />
    </G>
  );
}

/** Day: a little star naps on a cloud. Night: a star for each month, joining into a heart by the first birthday. */
export function StarlightArt({ months, night, bg, ...p }: Props & { months: number; night: boolean; bg: string }) {
  if (!night) return <Svg {...box(p)}><StarlightDayBack /><StarlightDayStar /></Svg>;
  return (
    <Svg {...box(p)}>
      <StarlightNightBack months={months} bg={bg} />
      <StarlightHeartStars months={months} set={0} />
      <StarlightHeartStars months={months} set={1} />
      <StarlightNightStar />
    </Svg>
  );
}

/** The drawing for a look at a given point in the journey, or null for Calm. */
export function LookArt({ look, week, months, night, bg, ...p }: Props & { look: LookName; week: number; months: number; night: boolean; bg: string }) {
  switch (look) {
    case "bloom": return <BloomArt week={week} {...p} />;
    case "nest": return <NestArt week={week} {...p} />;
    case "sky": return <SkyArt night={night} bg={bg} {...p} />;
    case "starlight": return <StarlightArt months={months} night={night} bg={bg} {...p} />;
    case "storybook": return <StorybookArt months={months} {...p} />;
    case "friend": return <FriendArt months={months} {...p} />;
    default: return null;
  }
}
