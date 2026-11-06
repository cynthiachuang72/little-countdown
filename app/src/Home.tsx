import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, DateField, IconButton, Pill, Remove, styles as ui, T, Tag } from "./components";
import {
  addMonths, babyAge, comingUp, milestones, countWorkdays, monthsBetween, nextBabyMilestone, diff, fmt, iso, joyFor, offSet, parse, plural, pregnancy, pruneJoys, streak, today, usHolidays, weekdaysIn,
} from "./lib/core";
import { AddAppointment, NextAppointment } from "./Appointments";
import BabyHere from "./BabyHere";
import Celebration from "./Celebration";
import Hero from "./Hero";
import { BreathingDot, CountUp } from "./scenes";
import LookSheet from "./LookSheet";
import type { LookName } from "./lib/looks";
import Settings from "./Settings";
import { newId, useStore } from "./store";
import { fonts, usePalette } from "./theme";

export default function Home() {
  const { c, f, r, look, illustrated } = usePalette();
  const insets = useSafeAreaInsets();
  const { state, update, tick } = useStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const t = useMemo(() => today(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const key = iso(t);
  const due = parse(state.due), leave = parse(state.leave);
  const bd = Math.max(0, diff(t, due)), ld = diff(t, leave);
  const wd = countWorkdays(t, leave, offSet(state.daysOff));
  const preg = pregnancy(due, t);
  const joy = joyFor(state, key);
  const joyDone = !!state.joys[key]?.d;
  const st = streak(state, t);
  const entries = comingUp(state, t);
  const undated = state.items.filter((i) => !i.date);
  const born = state.born ? parse(state.born) : null;
  const age = born ? babyAge(born, t) : null;
  const next = born ? nextBabyMilestone(born, t) : null;
  const yearPct = born ? Math.min(100, (diff(born, t) / diff(born, addMonths(born, 12))) * 100) : 0;
  const [babyOpen, setBabyOpen] = useState(false);
  const [lookOpen, setLookOpen] = useState(false);
  const [celebrateFrom, setCelebrateFrom] = useState<LookName | null>(null);
  const months = born ? monthsBetween(born, t) : 0;
  const milestoneToday = born ? null : milestones(due, leave, t).find((m) => diff(t, m.date) === 0)?.title ?? null;

  const hr = new Date().getHours();
  const greet = (hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening") + (state.name ? ", " + state.name : "");

  // ---- joy card pop ----
  const pop = useRef(new Animated.Value(1)).current;
  const celebrate = () => Animated.sequence([
    Animated.timing(pop, { toValue: 1.05, duration: 160, useNativeDriver: true }),
    Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }),
  ]).start();

  const toggleJoy = () => {
    const nowDone = !joyDone;
    update((s) => ({
      ...s,
      joys: pruneJoys({ ...s.joys, [key]: { ...(s.joys[key] || {}), d: nowDone } }, t),
      nestJoys: nowDone ? [...s.nestJoys.filter((k) => k !== key), key] : s.nestJoys.filter((k) => k !== key),
    }));
    if (nowDone) celebrate();
  };
  const nextJoy = () => update((s) => ({ ...s, joys: { ...s.joys, [key]: { s: (s.joys[key]?.s || 0) + 1, d: false } } }));

  // ---- add forms ----
  const [title, setTitle] = useState("");
  const [itemDate, setItemDate] = useState<string | null>(null);
  const addItem = () => {
    const tt = title.trim();
    if (!tt) return;
    update((s) => ({ ...s, items: [...s.items, { id: newId("i"), title: tt, date: itemDate }] }));
    setTitle("");
    setItemDate(null);
  };

  const [offLabel, setOffLabel] = useState("");
  const [offStart, setOffStart] = useState<string | null>(null);
  const [offEnd, setOffEnd] = useState<string | null>(null);
  const [offHint, setOffHint] = useState("Weekdays you're off come out of your workday count. Weekends are already left out.");
  const addOff = () => {
    const label = offLabel.trim();
    if (!label || !offStart) { setOffHint("Add a name and a first day off."); return; }
    if (offEnd && offEnd < offStart) { setOffHint("The last day off needs to be on or after the first day."); return; }
    update((s) => ({ ...s, daysOff: [...s.daysOff, { id: newId("o"), label, start: offStart, end: offEnd && offEnd !== offStart ? offEnd : null }] }));
    setOffLabel(""); setOffStart(null); setOffEnd(null);
    setOffHint("Added. Your workday count is updated.");
  };
  const addHolidays = () => {
    const have = new Set(state.daysOff.map((o) => o.start));
    const fresh: typeof state.daysOff = [];
    for (let y = t.getFullYear(); y <= leave.getFullYear(); y++) {
      usHolidays(y).forEach(([label, d]) => {
        const k = iso(d);
        if (d >= t && d < leave && !have.has(k)) { fresh.push({ id: newId("h"), label, start: k, end: null }); have.add(k); }
      });
    }
    if (fresh.length) update((s) => ({ ...s, daysOff: [...s.daysOff, ...fresh] }));
    setOffHint(fresh.length ? `Added ${fresh.length} holidays before your leave. Remove any you don't get off.` : "Those holidays are already on your list.");
  };

  const pct = (d: Date) => Math.min(100, Math.max(0, (diff(preg.start, d) / 280) * 100));
  const long: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  const offSorted = [...state.daysOff].sort((a, b) => (a.start < b.start ? -1 : 1));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 48,
            paddingLeft: Math.max(16, insets.left),
            paddingRight: Math.max(16, insets.right),
            gap: 18,
            maxWidth: 520,
            width: "100%",
            alignSelf: "center",
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <T v="title">{greet}</T>
              <T v="small">{fmt(t, { weekday: "long", month: "long", day: "numeric" })}</T>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <IconButton label="Change the look" onPress={() => setLookOpen(true)}>
                <Ionicons name="color-palette-outline" size={20} color={c.muted} />
              </IconButton>
              <IconButton label="Settings" onPress={() => setSettingsOpen(true)}>
                <Ionicons name="settings-outline" size={20} color={c.muted} />
              </IconButton>
            </View>
          </View>

          {illustrated ? (
            <Hero look={look} week={preg.week} months={months} next={next ? { title: next.title, days: diff(t, next.date) } : null} babyName={state.babyName} bd={bd}
              joys={state.nestJoys.length} milestoneToday={milestoneToday} />
          ) : null}

          {state.sample ? (
            <View style={[s.sample, { borderColor: c.sky, backgroundColor: c.surface }]}>
              <T v="small" color="ink" style={{ flex: 1 }}>These are example dates. Add yours to start your countdown.</T>
              <Pill label="Set my dates" primary onPress={() => setSettingsOpen(true)} />
            </View>
          ) : null}

          {state.born ? (
            <>
          {/* After baby arrives: age and the next milestone */}
          <Pressable onPress={() => setBabyOpen(true)} accessibilityRole="button" accessibilityLabel="Change baby's birthday or name" style={{ flexDirection: "row", gap: 12 }}>
            <Card tone="roseSoft" style={[s.count, { overflow: "hidden" }]}>
              <T v="label">{state.babyName ? `${state.babyName} is` : "Baby is"}</T>
              <T v="display" color="rose"><CountUp value={age!.num} animate={look === "calm"} /></T>
              <T v="strong">{age!.unit}</T>
              <T v="small">{age!.extra || `Born ${fmt(born!)}`}</T>
            </Card>
            <Card tone="sageSoft" style={[s.count, { overflow: "hidden" }]}>
              <T v="label">Next milestone</T>
              {next ? (
                <>
                  <T v="display" color="sage"><CountUp value={diff(t, next.date)} animate={look === "calm"} /></T>
                  <T v="strong">{diff(t, next.date) === 0 ? "it's today!" : `${plural(diff(t, next.date), "day")} to go`}</T>
                  <T v="small">{next.title} · {fmt(next.date)}</T>
                </>
              ) : (
                <T v="strong">So many milestones already</T>
              )}
            </Card>
          </Pressable>

            </>
          ) : (
            <>
          {/* Countdowns */}
          <Pressable onPress={() => setSettingsOpen(true)} accessibilityRole="button" accessibilityLabel="Change your dates" style={{ flexDirection: "row", gap: 12 }}>
            <Card tone="roseSoft" style={[s.count, { overflow: "hidden" }]}>
              <T v="label">Baby arrives</T>
              <T v="display" color="rose"><CountUp value={bd} animate={look === "calm"} /></T>
              <T v="strong">{bd === 0 ? "today could be the day" : plural(bd, "day")}</T>
              <T v="small">Due {fmt(due)} · {Math.floor(bd / 7)}w {bd % 7}d</T>
            </Card>
            <Card tone="sageSoft" style={[s.count, { overflow: "hidden" }]}>
              <T v="label">Leave starts</T>
              <T v="display" color="sage"><CountUp value={Math.max(0, ld)} animate={look === "calm"} /></T>
              <T v="strong">{ld <= 0 ? "you're on leave" : plural(ld, "day")}</T>
              <T v="small">
                {ld > 0 ? `${fmt(leave)} · ${wd.n} ${plural(wd.n, "workday")} left${wd.skipped ? ` after ${wd.skipped} off` : ""}` : "since " + fmt(leave)}
              </T>
            </Card>
          </Pressable>

            </>
          )}

          {!state.born && bd <= 14 && !state.sample ? (
            <Card tone="roseSoft" style={{ flexDirection: "row", alignItems: "center", gap: 12, overflow: "hidden" }}>
              <View style={{ flex: 1 }}>
                <T v="strong">Has your little one arrived?</T>
                <T v="small">Switch to counting down baby's milestones.</T>
              </View>
              <Pill label="Baby is here!" primary onPress={() => setBabyOpen(true)} />
            </Card>
          ) : null}

          <NextAppointment t={t} />

          {state.born ? (
            <>
          {/* First year */}
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={[s.seedBox, { backgroundColor: illustrated ? c.roseSoft : c.bg }]}>
                <Ionicons name="heart" size={22 + Math.min(1, yearPct / 100) * 14} color={c.rose} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="h2">{yearPct < 100 ? `Month ${Math.min(12, monthsBetween(born!, t) + 1)} of the first year` : "Past the first year"}</T>
                <T v="small">{diff(born!, t)} {plural(diff(born!, t), "day")} together so far.</T>
              </View>
            </View>
            {yearPct < 100 ? (
              <View style={{ marginTop: 14, marginBottom: 2 }}>
                <View style={[s.track, { backgroundColor: c.bg }]}>
                  <View style={[s.fill, { width: `${yearPct}%`, backgroundColor: c.rose }]} />
                  <BreathingDot run={look === "calm"} style={[s.pin, { left: `${yearPct}%`, backgroundColor: c.ink, borderColor: c.surface }]} />
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                  {["Birth", "3 mo", "6 mo", "9 mo", "1 year"].map((x) => <T key={x} v="small" style={{ fontSize: 12 }}>{x}</T>)}
                </View>
              </View>
            ) : null}
          </Card>

            </>
          ) : (
            <>
          {/* Journey */}
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={[s.seedBox, { backgroundColor: illustrated ? c.roseSoft : c.bg }]}>
                <View style={{ width: preg.dot, height: preg.dot, borderRadius: preg.dot / 2, backgroundColor: c.rose, opacity: 0.85 }} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="h2">Week {preg.week}{preg.day ? ` + ${preg.day} ${plural(preg.day, "day")}` : ""}</T>
                <T v="small">{preg.size ? `Baby is about the size of ${preg.size}.` : "Very early days"}</T>
              </View>
            </View>
            <View style={{ marginTop: 18, marginBottom: 6 }}>
              <View style={[s.track, { backgroundColor: c.bg }]}>
                <View style={[s.fill, { width: `${pct(t)}%`, backgroundColor: c.rose }]} />
                <View style={[s.pin, { left: `${pct(leave)}%`, backgroundColor: c.sage, borderColor: c.surface }]} />
                <BreathingDot run={look === "calm"} style={[s.pin, { left: `${pct(t)}%`, backgroundColor: c.ink, borderColor: c.surface }]} />
              </View>
              <View style={{ flexDirection: "row", marginTop: 10 }}>
                {["1st trimester", "2nd", "3rd"].map((x) => <T key={x} v="small" style={{ flex: 1, textAlign: "center", fontSize: 12 }}>{x}</T>)}
              </View>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 6, justifyContent: "center" }}>
                <Legend color={c.ink} text="Today" />
                <Legend color={c.sage} text="Leave starts" />
              </View>
            </View>
          </Card>

            </>
          )}

          {/* Joy */}
          <Animated.View style={{ transform: [{ scale: pop }] }}>
            <Card style={{ overflow: "hidden" }}>
              <View pointerEvents="none" style={[s.blob, { backgroundColor: c.roseSoft }]} />
              <T v="label">Today's little joy</T>
              <T v="h2" style={{ fontSize: 23, lineHeight: 30 }}>{joy.text}</T>
              <T v="small">{joy.mine ? "From your own list" : "A small thing to look forward to"}</T>
              <View style={ui.row}>
                <Pill label={joyDone ? "Done today" : "I did it"} primary done={joyDone} onPress={toggleJoy} />
                <Pill label="Another idea" onPress={nextJoy} />
              </View>
              {st > 0 ? <T v="small">{st > 1 ? `${st} days in a row of little joys` : "One little joy collected"}</T> : null}
              {look === "nest" && !state.born ? (
                <T v="small">{joyDone ? "Added to your nest" : "Each little joy you do adds something to your nest"}</T>
              ) : null}
            </Card>
          </Animated.View>

          {/* Coming up */}
          <Section title="Coming up" right={`${entries.length} ahead`}>
            <View style={[s.list, { backgroundColor: c.surface, borderRadius: r }]}>
              {entries.length === 0 ? <T v="small" style={{ padding: 16 }}>Nothing on the calendar yet. Add something below.</T> : null}
              {entries.map((e, i) => {
                const n = diff(t, e.date);
                return (
                  <View key={e.key} style={[s.li, { borderTopColor: c.line, borderTopWidth: i ? StyleSheet.hairlineWidth : 0 }, n === 0 && { backgroundColor: c.sageSoft }]}>
                    <View style={s.days}>
                      <T style={{ fontFamily: f.display, fontSize: 22, lineHeight: 30, fontVariant: ["lining-nums", "tabular-nums"] }}>{n === 0 ? "✓" : n}</T>
                      <T v="small" style={{ fontSize: 11 }}>{n === 0 ? "today" : plural(n, "day")}</T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T v="strong">{e.title}</T>
                      <T v="small">{e.sub}</T>
                    </View>
                    {e.kind === "appt" && e.id ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                        <Tag text="appointment" tone="mine" />
                        <Remove label={e.title} onPress={() => update((x) => ({ ...x, appts: x.appts.filter((a) => a.id !== e.id) }))} />
                      </View>
                    ) : e.kind === "mine" && e.id ? (
                      <Remove label={e.title} onPress={() => update((x) => ({ ...x, items: x.items.filter((it) => it.id !== e.id) }))} />
                    ) : (
                      <Tag text={e.kind === "off" ? "day off" : "milestone"} tone={e.kind === "off" ? "off" : "auto"} />
                    )}
                  </View>
                );
              })}
            </View>
          </Section>

          {/* Appointments */}
          <Section title="Appointments" right={state.appts.length ? `${state.appts.filter((a) => diff(t, parse(a.date)) >= 0).length} upcoming` : ""}>
            <AddAppointment />
          </Section>

          {/* Someday */}
          <Section title="Someday soon" right="no date yet">
            <View style={ui.row}>
              {undated.length === 0 ? <T v="small">Add things without a date, like a first glass of wine or a long hot shower in peace.</T> : null}
              {undated.map((i) => (
                <View key={i.id} style={[s.chip, { backgroundColor: c.surface, borderColor: c.line }]}>
                  <T v="small" color="ink" style={{ flexShrink: 1, fontSize: 14 }}>{i.title}</T>
                  <Remove label={i.title} onPress={() => update((x) => ({ ...x, items: x.items.filter((it) => it.id !== i.id) }))} />
                </View>
              ))}
            </View>
          </Section>

          {/* Add something */}
          <Card>
            <T v="label">Add something to look forward to</T>
            <Field label="What is it?">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Baby shower, new crib arriving, sushi again…"
                placeholderTextColor={c.muted}
                maxLength={90}
                returnKeyType="done"
                onSubmitEditing={addItem}
                style={[s.input, { borderColor: c.line, backgroundColor: c.bg, color: c.ink }]}
              />
            </Field>
            <DateField label="Date (optional)" value={itemDate} onChange={setItemDate} optional />
            <View style={ui.row}><Pill label="Add" primary onPress={addItem} /></View>
            <T v="small">Dated plans join the countdown. Undated ones show up as a little joy now and then.</T>
          </Card>

          {state.born ? null : (
            <>
          {/* Days off */}
          <Section title="Days off before leave" right={wd.skipped ? `${wd.skipped} workdays saved` : ""}>
            {offSorted.length ? (
              <View style={[s.list, { backgroundColor: c.surface, borderRadius: r }]}>
                {offSorted.map((o, i) => {
                  const n = weekdaysIn(o);
                  const past = diff(t, parse(o.end || o.start)) < 0 || parse(o.start) >= leave;
                  return (
                    <View key={o.id} style={[s.li, { borderTopColor: c.line, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, opacity: past ? 0.5 : 1 }]}>
                      <View style={s.days}>
                        <T style={{ fontFamily: f.display, fontSize: 22, lineHeight: 30, fontVariant: ["lining-nums", "tabular-nums"] }}>{n}</T>
                        <T v="small" style={{ fontSize: 11 }}>{plural(n, "day")}</T>
                      </View>
                      <View style={{ flex: 1 }}>
                        <T v="strong">{o.label}</T>
                        <T v="small">{fmt(parse(o.start), long)}{o.end ? " – " + fmt(parse(o.end), long) : ""}</T>
                      </View>
                      <Remove label={o.label} onPress={() => update((x) => ({ ...x, daysOff: x.daysOff.filter((d) => d.id !== o.id) }))} />
                    </View>
                  );
                })}
              </View>
            ) : null}
            <Card>
              <T v="label">Add a holiday or time off</T>
              <Field label="Name">
                <TextInput
                  value={offLabel}
                  onChangeText={setOffLabel}
                  placeholder="Thanksgiving, PTO, office closed…"
                  placeholderTextColor={c.muted}
                  maxLength={60}
                  style={[s.input, { borderColor: c.line, backgroundColor: c.bg, color: c.ink }]}
                />
              </Field>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <DateField label="First day off" value={offStart} onChange={setOffStart} />
                <DateField label="Last day (optional)" value={offEnd} onChange={setOffEnd} optional />
              </View>
              <View style={ui.row}>
                <Pill label="Add day off" primary onPress={addOff} />
                <Pill label="Add US public holidays" onPress={addHolidays} />
              </View>
              <T v="small">{offHint}</T>
            </Card>
          </Section>

            </>
          )}

          <T v="small" style={{ textAlign: "center", fontSize: 12 }}>
            Little Countdown is for fun and planning. It isn't medical advice.
          </T>
        </ScrollView>
      </KeyboardAvoidingView>

      <Settings visible={settingsOpen} onClose={() => setSettingsOpen(false)} onBaby={() => { setSettingsOpen(false); setBabyOpen(true); }} />
      <BabyHere visible={babyOpen} onClose={() => setBabyOpen(false)} onArrived={(from) => setCelebrateFrom(from)} />
      <LookSheet visible={lookOpen} onClose={() => setLookOpen(false)} />
      <Celebration from={celebrateFrom} onDone={() => setCelebrateFrom(null)} />
    </View>
  );
}

function Section({ title, right, children }: { title: string; right?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <T v="h2">{title}</T>
        {right ? <T v="label">{right}</T> : null}
      </View>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ gap: 4 }}><T v="small">{label}</T>{children}</View>;
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <T v="small" style={{ fontSize: 12 }}>{text}</T>
    </View>
  );
}

const s = StyleSheet.create({
  sample: { borderWidth: 1, borderStyle: "dashed", borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  count: { flex: 1, gap: 2, paddingHorizontal: 16 },
  seedBox: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  track: { height: 10, borderRadius: 5, position: "relative" },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 5, opacity: 0.8 },
  pin: { position: "absolute", top: -2, width: 14, height: 14, marginLeft: -7, borderRadius: 7, borderWidth: 3 },
  blob: { position: "absolute", right: -40, top: -40, width: 140, height: 140, borderRadius: 70, opacity: 0.7 },
  list: { borderRadius: 22, overflow: "hidden" },
  li: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  days: { width: 50, alignItems: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 999, paddingLeft: 14, paddingRight: 6, paddingVertical: 4, maxWidth: "100%" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, fontFamily: fonts.body, fontSize: 16 },
});
