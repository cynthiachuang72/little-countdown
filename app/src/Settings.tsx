import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DateField, Pill, styles as ui, T, TimeField } from "./components";
import { askPermission } from "./notifications";
import { useStore } from "./store";
import { fonts, THEMES, usePalette } from "./theme";

/** Bottom sheet for due date, leave date, name and the daily reminder. */
export default function Settings({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = usePalette();
  const insets = useSafeAreaInsets();
  const { state, update } = useStore();
  const [name, setName] = useState(state.name);
  const [due, setDue] = useState<string | null>(state.due);
  const [leave, setLeave] = useState<string | null>(state.leave);
  const [remOn, setRemOn] = useState(state.reminder.on);
  const [hour, setHour] = useState(state.reminder.hour);
  const [minute, setMinute] = useState(state.reminder.minute);
  const [note, setNote] = useState("");

  // Start from the saved values each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setName(state.name); setDue(state.due); setLeave(state.leave);
    setRemOn(state.reminder.on); setHour(state.reminder.hour); setMinute(state.reminder.minute); setNote("");
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!due || !leave) { setNote("Add both your due date and the day leave starts."); return; }
    let on = remOn;
    if (on) {
      const ok = await askPermission();
      if (!ok) { on = false; setRemOn(false); setNote("Notifications are off for Little Countdown. Turn them on in your phone's Settings to get reminders."); return; }
    }
    update((s) => ({
      ...s,
      items: s.sample ? s.items.filter((i) => !i.id.startsWith("ex")) : s.items,
      appts: s.sample ? s.appts.filter((a) => !a.id.startsWith("ex")) : s.appts,
      sample: false,
      name: name.trim(),
      due,
      leave,
      reminder: { on, hour, minute },
    }));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
        <View style={[s.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + 22 }]}>
          <ScrollView contentContainerStyle={{ gap: 16 }} keyboardShouldPersistTaps="handled">
            <T v="h2">Look</T>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {THEMES.map((th) => {
                const on = state.theme === th.name;
                return (
                  <Pressable
                    key={th.name}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={th.label + " theme"}
                    onPress={() => update((x) => ({ ...x, theme: th.name }))}
                    style={[s.themeCard, { borderColor: on ? c.rose : c.line, backgroundColor: th.swatch[0] }]}
                  >
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {th.swatch.slice(1).map((col) => <View key={col} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: col }} />)}
                    </View>
                    <T v="strong" style={{ color: "#2A3147" }}>{th.label}{on ? " ✓" : ""}</T>
                    <T v="small" style={{ color: "#6B7390" }}>{th.note}</T>
                  </Pressable>
                );
              })}
            </View>

            <View style={[s.divider, { backgroundColor: c.line }]} />
            <T v="h2">Your dates</T>
            <View style={{ gap: 4 }}>
              <T v="small">Your name (for the greeting)</T>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Optional"
                placeholderTextColor={c.muted}
                maxLength={40}
                style={[s.input, { borderColor: c.line, backgroundColor: c.bg, color: c.ink }]}
              />
            </View>
            <DateField label="Due date" value={due} onChange={setDue} />
            <DateField label="Maternity leave starts" value={leave} onChange={setLeave} />

            <View style={[s.divider, { backgroundColor: c.line }]} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <T v="strong">Morning reminder</T>
                <T v="small">A gentle note with your countdown and today's little joy.</T>
              </View>
              <Switch value={remOn} onValueChange={setRemOn} trackColor={{ true: c.sage, false: c.line }} accessibilityLabel="Morning reminder" />
            </View>
            {remOn ? <TimeField label="Remind me at" hour={hour} minute={minute} onChange={(h, m) => { setHour(h); setMinute(m); }} /> : null}

            {note ? <T v="small" color="rose">{note}</T> : null}
            <View style={ui.row}>
              <Pill label="Save" primary onPress={save} />
              <Pill label="Cancel" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 22, paddingHorizontal: 18, maxHeight: "90%" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, fontFamily: fonts.body, fontSize: 16 },
  divider: { height: StyleSheet.hairlineWidth },
  themeCard: { flex: 1, borderWidth: 2, borderRadius: 18, padding: 12, gap: 6 },
});
