// Little Countdown — iPhone widget for the Scriptable app.
// Sizes: small and medium home screen widgets, plus rectangular, circular and inline lock screen widgets.
//
// Setup: in the Little Countdown app, open the widget view (grid icon) and copy the widget code.
// Long-press the widget → Edit Widget → paste the code into "Parameter".
// The code looks like: d=2027-03-14;l=2027-02-26;n=Cynthia;o=2026-11-26,2026-12-24~2026-12-31

const EXAMPLE = "d=2027-03-14;l=2027-02-26";

// ---------- read the setup code ----------
function readSetup(text) {
  const out = { due: null, leave: null, name: "", off: [] };
  (text || "").split(";").forEach((part) => {
    const i = part.indexOf("="); if (i < 0) return;
    const k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
    if (k === "d") out.due = v;
    else if (k === "l") out.leave = v;
    else if (k === "n") out.name = v;
    else if (k === "o") out.off = v.split(",").filter(Boolean).map((r) => r.split("~"));
  });
  return out;
}

const raw = (args.widgetParameter || "").trim();
const usingExample = !raw;
const setup = readSetup(raw || EXAMPLE);

// ---------- dates ----------
const DAY = 864e5;
const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const diff = (a, b) => Math.round((b - a) / DAY);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const today = startOfDay(new Date());
const due = parse(setup.due || "2027-03-14");
const leave = parse(setup.leave || setup.due || "2027-02-26");

const babyDays = Math.max(0, diff(today, due));
const leaveDays = Math.max(0, diff(today, leave));

const offSet = new Set();
setup.off.forEach(([s, e]) => {
  const a = parse(s), b = e ? parse(e) : a;
  for (let d = new Date(a); d <= b && diff(a, d) < 400; d = addDays(d, 1)) offSet.add(iso(d));
});
let workdays = 0;
for (let d = new Date(today); d < leave; d = addDays(d, 1)) {
  const w = d.getDay();
  if (w !== 0 && w !== 6 && !offSet.has(iso(d))) workdays++;
}

const start = addDays(due, -280);
const week = Math.max(0, Math.min(42, Math.floor(diff(start, today) / 7)));
const progress = Math.max(0, Math.min(1, diff(start, today) / 280));

// ---------- today's little joy (same list as the app) ----------
const IDEAS = [
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
  "Plan a small treat for your last day of work."
];
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); }
const joy = IDEAS[hash(iso(today)) % IDEAS.length];

// ---------- look ----------
const C = {
  bg: Color.dynamic(new Color("#FBFCFE"), new Color("#202535")),
  ink: Color.dynamic(new Color("#2A3147"), new Color("#E9ECF4")),
  muted: Color.dynamic(new Color("#6B7390"), new Color("#9AA2BC")),
  rose: Color.dynamic(new Color("#C9738B"), new Color("#E7A3B6")),
  roseSoft: Color.dynamic(new Color("#F6E3E9"), new Color("#3A2C37")),
  sage: Color.dynamic(new Color("#5F9274"), new Color("#9CC4AB")),
  sageSoft: Color.dynamic(new Color("#E1EEE6"), new Color("#26352F")),
  track: Color.dynamic(new Color("#EDF0F6"), new Color("#161A25"))
};
const serif = (size) => new Font("Georgia", size);
const rounded = (size) => Font.semiboldRoundedSystemFont(size);
const plural = (n, w) => n + " " + (n === 1 ? w : w + "s");
const family = config.widgetFamily || "medium";

function numberTile(parent, num, label, soft, strong, big) {
  const t = parent.addStack();
  t.layoutVertically();
  t.backgroundColor = soft;
  t.cornerRadius = 16;
  t.setPadding(10, 12, 10, 12);
  const n = t.addText(String(num));
  n.font = serif(big);
  n.textColor = strong;
  n.minimumScaleFactor = 0.6;
  n.lineLimit = 1;
  const l = t.addText(label);
  l.font = rounded(11);
  l.textColor = C.muted;
  l.lineLimit = 1;
  l.minimumScaleFactor = 0.8;
  return t;
}

function progressBar(parent, width) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, 8);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const bg = new Path(); bg.addRoundedRect(new Rect(0, 0, width, 8), 4, 4);
  ctx.addPath(bg); ctx.setFillColor(new Color("#888ea6", 0.22)); ctx.fillPath();
  const w = Math.max(8, width * progress);
  const fg = new Path(); fg.addRoundedRect(new Rect(0, 0, w, 8), 4, 4);
  ctx.addPath(fg); ctx.setFillColor(new Color("#C9738B")); ctx.fillPath();
  const img = parent.addImage(ctx.getImage());
  img.imageSize = new Size(width, 8);
}

const w = new ListWidget();
w.refreshAfterDate = addDays(today, 1); // redraw just after midnight

if (family === "accessoryInline") {
  const t = w.addText(plural(babyDays, "day") + " to baby · " + leaveDays + " to leave");
  t.font = rounded(12);
} else if (family === "accessoryCircular") {
  w.addAccessoryWidgetBackground = true;
  const n = w.addText(String(babyDays)); n.font = Font.boldRoundedSystemFont(20); n.centerAlignText(); n.minimumScaleFactor = 0.6;
  const l = w.addText("baby"); l.font = rounded(10); l.centerAlignText();
} else if (family === "accessoryRectangular") {
  const r = w.addStack(); r.centerAlignContent();
  const a = r.addText(String(babyDays)); a.font = Font.boldRoundedSystemFont(22);
  const al = r.addText(" baby"); al.font = rounded(12);
  r.addSpacer(10);
  const b = r.addText(String(leaveDays)); b.font = Font.boldRoundedSystemFont(22);
  const bl = r.addText(" leave"); bl.font = rounded(12);
  const j = w.addText(joy); j.font = rounded(11); j.lineLimit = 2; j.minimumScaleFactor = 0.8;
} else {
  w.backgroundColor = C.bg;
  const small = family === "small";
  w.setPadding(small ? 12 : 14, small ? 12 : 16, small ? 12 : 14, small ? 12 : 16);

  const top = w.addStack(); top.centerAlignContent();
  const dateFmt = new DateFormatter(); dateFmt.dateFormat = small ? "EEE d MMM" : "EEEE, MMM d";
  const dt = top.addText(dateFmt.string(new Date())); dt.font = rounded(11); dt.textColor = C.muted;
  top.addSpacer();
  const wk = top.addText("Week " + week); wk.font = rounded(11); wk.textColor = C.rose;

  w.addSpacer(small ? 6 : 8);
  const row = w.addStack(); row.spacing = 8;
  numberTile(row, babyDays, small ? "to baby" : plural(babyDays, "day") + " to baby", C.roseSoft, C.rose, small ? 30 : 36);
  if (!small) row.addSpacer(0);
  numberTile(row, leaveDays, small ? "to leave" : workdays + " workdays to leave", C.sageSoft, C.sage, small ? 30 : 36);

  w.addSpacer(small ? 6 : 8);
  if (small) {
    progressBar(w, 130);
  } else {
    const label = w.addText(usingExample ? "Example dates. Paste your widget code in Edit Widget → Parameter." : "Today: " + joy);
    label.font = rounded(12); label.textColor = C.ink; label.lineLimit = 2; label.minimumScaleFactor = 0.85;
  }
}

if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  await w.presentMedium();
}
Script.complete();
