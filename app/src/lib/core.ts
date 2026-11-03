// Pure countdown logic shared by the app, notifications and both widgets.
// No React Native imports here, so it can run anywhere (including widget background tasks).

export type Item = { id: string; title: string; date: string | null };
export type DayOff = { id: string; label: string; start: string; end: string | null };
export type JoyRecord = { s?: number; d?: boolean };
export type ThemeName = "calm" | "cute";

export type State = {
  v: 1;
  sample: boolean;
  name: string;
  due: string;
  leave: string;
  items: Item[];
  daysOff: DayOff[];
  joys: Record<string, JoyRecord>;
  reminder: { on: boolean; hour: number; minute: number };
  theme: ThemeName;
};

export const SAMPLE: State = {
  v: 1,
  sample: true,
  name: "",
  due: "2027-03-14",
  leave: "2027-02-26",
  items: [
    { id: "ex1", title: "Baby shower (example)", date: "2026-12-12" },
    { id: "ex2", title: "Nursery furniture arrives (example)", date: "2026-11-20" },
    { id: "ex3", title: "Eat sushi again (example)", date: null },
  ],
  daysOff: [],
  joys: {},
  reminder: { on: false, hour: 8, minute: 30 },
  theme: "calm",
};

export function normalize(raw: unknown): State {
  const base = JSON.parse(JSON.stringify(SAMPLE)) as State;
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<State>;
  return {
    ...base,
    ...r,
    items: Array.isArray(r.items) ? r.items : base.items,
    daysOff: Array.isArray(r.daysOff) ? r.daysOff : [],
    joys: r.joys && typeof r.joys === "object" ? r.joys : {},
    reminder: { ...base.reminder, ...(r.reminder || {}) },
    theme: r.theme === "cute" ? "cute" : "calm",
    v: 1,
  };
}

// ---------- dates (all local, date-only) ----------
export const DAY = 864e5;
export function parse(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function iso(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
export function today(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
export function diff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY);
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export const plural = (n: number, w: string) => (n === 1 ? w : w + "s");
export function fmt(d: Date, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return d.toLocaleDateString(undefined, opts);
}
export const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

// ---------- days off & workdays ----------
export function offSet(daysOff: DayOff[]): Set<string> {
  const set = new Set<string>();
  daysOff.forEach((o) => {
    const s = parse(o.start), e = o.end ? parse(o.end) : s;
    for (let d = new Date(s); d <= e && diff(s, d) < 400; d = addDays(d, 1)) set.add(iso(d));
  });
  return set;
}
export function weekdaysIn(o: DayOff): number {
  const s = parse(o.start), e = o.end ? parse(o.end) : s;
  let n = 0;
  for (let d = new Date(s); d <= e && diff(s, d) < 400; d = addDays(d, 1)) if (!isWeekend(d)) n++;
  return n;
}
/** Workdays from `from` (inclusive) to the day before `to`, minus weekends and days off. */
export function countWorkdays(from: Date, to: Date, off: Set<string>): { n: number; skipped: number } {
  let n = 0, skipped = 0;
  for (let d = new Date(from); d < to; d = addDays(d, 1)) {
    if (isWeekend(d)) continue;
    if (off.has(iso(d))) skipped++;
    else n++;
  }
  return { n, skipped };
}

/** US federal holidays (weekend dates moved to Friday/Monday) plus the day after Thanksgiving. */
export function usHolidays(year: number): [string, Date][] {
  const nth = (m: number, wd: number, k: number) => {
    const d = new Date(year, m, 1);
    return new Date(year, m, 1 + ((wd - d.getDay() + 7) % 7) + (k - 1) * 7);
  };
  const last = (m: number, wd: number) => {
    const d = new Date(year, m + 1, 0);
    return addDays(d, -((d.getDay() - wd + 7) % 7));
  };
  const obs = (d: Date) => (d.getDay() === 6 ? addDays(d, -1) : d.getDay() === 0 ? addDays(d, 1) : d);
  const tg = nth(10, 4, 4);
  return [
    ["New Year's Day", obs(new Date(year, 0, 1))],
    ["Martin Luther King Jr. Day", nth(0, 1, 3)],
    ["Presidents' Day", nth(1, 1, 3)],
    ["Memorial Day", last(4, 1)],
    ["Juneteenth", obs(new Date(year, 5, 19))],
    ["Independence Day", obs(new Date(year, 6, 4))],
    ["Labor Day", nth(8, 1, 1)],
    ["Thanksgiving", tg],
    ["Day after Thanksgiving", addDays(tg, 1)],
    ["Christmas Day", obs(new Date(year, 11, 25))],
  ];
}

// ---------- pregnancy week ----------
export const SIZES: Record<number, string> = {
  4: "a poppy seed", 5: "a sesame seed", 6: "a lentil", 7: "a blueberry", 8: "a raspberry", 9: "a cherry",
  10: "a kumquat", 11: "a fig", 12: "a lime", 13: "a lemon", 14: "a peach", 15: "an apple", 16: "an avocado",
  17: "a pear", 18: "a bell pepper", 19: "a mango", 20: "a banana", 21: "a carrot", 22: "a papaya",
  23: "a grapefruit", 24: "an ear of corn", 25: "a rutabaga", 26: "a head of lettuce", 27: "a cauliflower",
  28: "an eggplant", 29: "a butternut squash", 30: "a cabbage", 31: "a coconut", 32: "a jicama",
  33: "a pineapple", 34: "a cantaloupe", 35: "a honeydew melon", 36: "a head of romaine",
  37: "a bunch of chard", 38: "a leek", 39: "a mini watermelon", 40: "a small pumpkin", 41: "a small pumpkin", 42: "a small pumpkin",
};
export function pregnancy(due: Date, t: Date) {
  const start = addDays(due, -280);
  const elapsed = Math.max(0, diff(start, t));
  const week = Math.min(42, Math.floor(elapsed / 7));
  const day = elapsed % 7;
  return {
    start,
    week,
    day,
    size: week < 4 ? null : SIZES[week],
    progress: Math.min(1, elapsed / 280),
    dot: 8 + ((Math.min(40, Math.max(4, week)) - 4) / 36) * 48,
  };
}

// ---------- milestones ----------
export type Milestone = { date: Date; title: string; sub: string };
export function milestones(due: Date, leave: Date, t: Date): Milestone[] {
  const start = addDays(due, -280);
  return [
    { date: addDays(start, 140), title: "Halfway there", sub: "Week 20" },
    { date: addDays(start, 196), title: "Third trimester begins", sub: "Week 28" },
    { date: addDays(start, 259), title: "Full term", sub: "Week 37" },
    { date: addDays(due, -100), title: "100 days to go", sub: "Triple digits no more" },
    { date: addDays(due, -50), title: "50 days to go", sub: "Halfway through the last hundred" },
    { date: addDays(leave, -7), title: "Last week of work begins", sub: "Leave starts a week later" },
    { date: leave, title: "Maternity leave starts", sub: "Rest, nest, slow mornings" },
    { date: due, title: "Due date", sub: "Hello, little one" },
  ].filter((m) => diff(t, m.date) >= 0);
}

// ---------- daily little joys ----------
export const IDEAS = [
  "Make a playlist of songs you want baby to hear first.",
  "Take a bump photo in the same spot as last week.",
  "Write baby a two-line letter about today.",
  "Order the dessert you have been craving.",
  "Pick one tiny outfit and hang it where you can see it.",
  "Take a slow 20-minute walk with no podcast.",
  "Write down the names you secretly love.",
  "Book a prenatal massage, or ask for a foot rub.",
  "Wash and fold a small stack of baby clothes.",
  "Rewatch a movie you loved as a kid.",
  "Plan your first meal after the birth.",
  "Ask someone what you were like as a baby.",
  "Read a picture book out loud to the bump.",
  "Take a warm bath with your favorite soap.",
  "Put fresh flowers by your bed.",
  "List three things you will not miss about work.",
  "Start a list of shows for night feeds.",
  "Have breakfast in bed, even if you make it yourself.",
  "Try a new smoothie or mocktail.",
  "Choose the spot for baby's first photo at home.",
  "Call someone who will be thrilled to hear from you.",
  "Treat yourself to new cozy socks or slippers.",
  "Write a first-year wish list: first park, first beach, first snow.",
  "Do a gentle prenatal stretch.",
  "Choose a lullaby and learn the words.",
  "Plan one more date night before baby arrives.",
  "Pack one thing for your hospital bag.",
  "Freeze one meal for the early weeks.",
  "Save a photo of yourself from today. Future you will want it.",
  "Write a short note for your partner or support person.",
  "Visit a café you have never tried.",
  "Hand off one small work task early. Practice letting go.",
  "Browse the baby books at the library.",
  "Sit outside for ten minutes and just breathe.",
  "List who you want baby to meet first.",
  "Take a nap. It is officially allowed.",
  "Tidy one shelf in the nursery.",
  "Put on music and sway with the bump.",
  "Start an email account for letters to baby.",
  "Bake something simple that makes the house smell good.",
  "Look through your own baby photos.",
  "Pick the outfit baby wears home.",
  "Write your maternity leave wish list: slow mornings, long walks.",
  "Ask a friend with kids for their single best tip.",
  "Write one sentence about how you feel today.",
  "Have a cozy night in with your favorite takeout.",
  "Plan a small treat for your last day of work.",
];
export function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
export function joyFor(state: State, key: string): { text: string; mine: boolean } {
  const shift = state.joys[key]?.s || 0;
  const mine = state.items.filter((i) => !i.date);
  const h = hash(key);
  // Every third suggestion comes from the person's own undated list, when there is one.
  if (mine.length && (h + shift) % 3 === 0) return { text: mine[(h + shift) % mine.length].title, mine: true };
  return { text: IDEAS[(h + shift * 7) % IDEAS.length], mine: false };
}
export function streak(state: State, t: Date): number {
  let n = 0, d = t;
  if (!state.joys[iso(d)]?.d) d = addDays(d, -1);
  while (state.joys[iso(d)]?.d) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
export function pruneJoys(joys: Record<string, JoyRecord>, t: Date) {
  const cut = iso(addDays(t, -120));
  const out: Record<string, JoyRecord> = {};
  Object.keys(joys).forEach((k) => { if (k >= cut) out[k] = joys[k]; });
  return out;
}

// ---------- the "Coming up" list ----------
export type Entry = { key: string; date: Date; title: string; sub: string; kind: "mine" | "off" | "milestone"; id?: string };
export function comingUp(state: State, t: Date): Entry[] {
  const due = parse(state.due), leave = parse(state.leave);
  const long: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  const mine: Entry[] = state.items
    .filter((i) => i.date && diff(t, parse(i.date)) >= 0)
    .map((i) => ({ key: "i" + i.id, date: parse(i.date!), title: i.title, sub: fmt(parse(i.date!), long), kind: "mine", id: i.id }));
  const offs: Entry[] = state.daysOff
    .filter((o) => diff(t, parse(o.end || o.start)) >= 0 && parse(o.start) < leave)
    .map((o) => {
      const s = parse(o.start), n = weekdaysIn(o);
      const range = fmt(s, long) + (o.end && o.end !== o.start ? " – " + fmt(parse(o.end)) : "");
      return { key: "o" + o.id, date: diff(t, s) < 0 ? t : s, title: o.label, sub: range + " · " + n + " " + plural(n, "workday") + " off", kind: "off" };
    });
  const ms: Entry[] = milestones(due, leave, t).map((m, i) => ({ key: "m" + i, date: m.date, title: m.title, sub: fmt(m.date, long) + " · " + m.sub, kind: "milestone" }));
  const rank = { mine: 0, off: 1, milestone: 2 };
  return [...mine, ...offs, ...ms].sort((a, b) => a.date.getTime() - b.date.getTime() || rank[a.kind] - rank[b.kind]);
}

// ---------- the summary both widgets and notifications use ----------
export type Snapshot = {
  due: string;
  leave: string;
  name: string;
  off: string[]; // every weekday off from today until leave
  joys: Record<string, string>; // today's little joy for the next 21 days
  theme: ThemeName;
  updated: string;
};
export function snapshot(state: State, t: Date = today()): Snapshot {
  const leave = parse(state.leave);
  const off = [...offSet(state.daysOff)].filter((k) => { const d = parse(k); return d >= t && d < leave && !isWeekend(d); }).sort();
  const joys: Record<string, string> = {};
  for (let i = 0; i < 21; i++) { const k = iso(addDays(t, i)); joys[k] = joyFor(state, k).text; }
  return { due: state.due, leave: state.leave, name: state.name, off, joys, theme: state.theme, updated: new Date().toISOString() };
}
/** Numbers shown on a widget for a given day, computed from a snapshot so widgets stay right without the app open. */
export function widgetNumbers(s: Snapshot, t: Date = today()) {
  const due = parse(s.due), leave = parse(s.leave);
  const wd = countWorkdays(t, leave, new Set(s.off));
  return {
    babyDays: Math.max(0, diff(t, due)),
    leaveDays: Math.max(0, diff(t, leave)),
    workdays: wd.n,
    week: pregnancy(due, t).week,
    joy: s.joys[iso(t)] || "Take a slow breath. You're doing great.",
  };
}
