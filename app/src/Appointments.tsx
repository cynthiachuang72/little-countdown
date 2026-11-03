import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import { Card, DateField, Pill, styles as ui, T, TimeField } from "./components";
import { APPT_PRESETS, diff, fmt, parse, State, timeLabel, upcomingAppts } from "./lib/core";
import { askPermission } from "./notifications";
import { newId, useStore } from "./store";
import { fonts, usePalette } from "./theme";

const long: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };

function whenText(n: number) {
  return n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`;
}

/** A card near the top showing the next appointment, if there is one. */
export function NextAppointment({ t }: { t: Date }) {
  const { c } = usePalette();
  const { state } = useStore();
  const next = upcomingAppts(state, t)[0];
  if (!next) return null;
  const n = diff(t, parse(next.date));
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 }}>
      <View style={[s.iconDot, { backgroundColor: c.roseSoft }]}>
        <Ionicons name="medkit-outline" size={20} color={c.rose} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="label">Next appointment</T>
        <T v="strong">{next.title}</T>
        <T v="small">{[fmt(parse(next.date), long), timeLabel(next.time), next.place].filter(Boolean).join(" · ")}</T>
      </View>
      <View style={[s.when, { backgroundColor: n <= 1 ? c.rose : c.roseSoft }]}>
        <T v="small" style={{ color: n <= 1 ? c.surface : c.rose, fontFamily: fonts.heavy }}>{whenText(n)}</T>
      </View>
    </Card>
  );
}

/** Form for adding a doctor's appointment, scan or class, plus the reminder switch. */
export function AddAppointment() {
  const { c } = usePalette();
  const { state, update } = useStore();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [place, setPlace] = useState("");
  const [hint, setHint] = useState("");

  const add = async () => {
    const tt = title.trim();
    if (!tt || !date) { setHint("Add what it is and the date."); return; }
    update((x: State) => ({ ...x, appts: [...x.appts, { id: newId("a"), title: tt, date, time, place: place.trim() }] }));
    setTitle(""); setDate(null); setTime(null); setPlace("");
    if (state.apptRemind) {
      const ok = await askPermission();
      setHint(ok ? "Added. You'll get a reminder the evening before." : "Added. Turn on notifications for Little Countdown in your phone's Settings to get reminders.");
    } else setHint("Added.");
  };

  const [h, m] = (time || "09:00").split(":").map(Number);
  const inputStyle = [s.input, { borderColor: c.line, backgroundColor: c.bg, color: c.ink }];

  return (
    <Card>
      <T v="label">Add an appointment</T>
      <View style={{ gap: 4 }}>
        <T v="small">What is it?</T>
        <TextInput value={title} onChangeText={setTitle} placeholder="OB check-up, ultrasound…" placeholderTextColor={c.muted} maxLength={60} style={inputStyle} />
        <View style={[ui.row, { marginTop: 4 }]}>
          {APPT_PRESETS.map((p) => (
            <Pressable key={p} onPress={() => setTitle(p)} accessibilityRole="button" accessibilityLabel={"Use " + p}
              style={({ pressed }) => [s.preset, { borderColor: title === p ? c.rose : c.line, backgroundColor: title === p ? c.roseSoft : c.surface, opacity: pressed ? 0.7 : 1 }]}>
              <T v="small" color={title === p ? "rose" : "ink"} style={{ fontSize: 13 }}>{p}</T>
            </Pressable>
          ))}
        </View>
      </View>
      <DateField label="Date" value={date} onChange={setDate} optional />
      {time ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TimeField label="Time" hour={h} minute={m} onChange={(hh, mm) => setTime(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`)} />
          </View>
          <Pill label="No time" onPress={() => setTime(null)} />
        </View>
      ) : (
        <View style={ui.row}><Pill label="Add a time" onPress={() => setTime("09:00")} /></View>
      )}
      <View style={{ gap: 4 }}>
        <T v="small">Where (optional)</T>
        <TextInput value={place} onChangeText={setPlace} placeholder="Dr. Patel, St. Mary's…" placeholderTextColor={c.muted} maxLength={60} style={inputStyle} />
      </View>
      <View style={ui.row}><Pill label="Add appointment" primary onPress={add} /></View>
      {hint ? <T v="small">{hint}</T> : null}
      <View style={[s.divider, { backgroundColor: c.line }]} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <T v="small" style={{ flex: 1 }}>Remind me the evening before, and an hour before when there's a time</T>
        <Switch value={state.apptRemind} onValueChange={(v) => update((x) => ({ ...x, apptRemind: v }))}
          trackColor={{ true: c.sage, false: c.line }} accessibilityLabel="Appointment reminders" />
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  iconDot: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  when: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  preset: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, fontFamily: fonts.body, fontSize: 16 },
  divider: { height: StyleSheet.hairlineWidth },
});
