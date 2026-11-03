import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DateField, Pill, styles as ui, T } from "./components";
import { iso, today } from "./lib/core";
import { useStore } from "./store";
import { fonts, usePalette } from "./theme";

/**
 * Switches the app from the pregnancy countdown to counting down baby's milestones.
 * Also used to edit the birth date or name, or to switch back.
 */
export default function BabyHere({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c, f } = usePalette();
  const insets = useSafeAreaInsets();
  const { state, update } = useStore();
  const [born, setBorn] = useState<string | null>(state.born);
  const [name, setName] = useState(state.babyName);
  const [confirmUndo, setConfirmUndo] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setBorn(state.born || iso(today()));
    setName(state.babyName);
    setConfirmUndo(false);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    if (!born) return;
    update((s) => ({ ...s, born, babyName: name.trim(), sample: false }));
    onClose();
  };
  const undo = () => {
    update((s) => ({ ...s, born: null }));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
        <View style={[s.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + 22 }]}>
          <ScrollView contentContainerStyle={{ gap: 16 }} keyboardShouldPersistTaps="handled">
            <T style={{ fontFamily: f.display, fontSize: 26, lineHeight: 34 }}>{state.born ? "About baby" : "Welcome, little one"}</T>
            <T v="small">
              {state.born
                ? "Change baby's birthday or name here."
                : "Little Countdown will count down to baby's next milestone instead: 1 week, 1 month, 100 days, each month and the first birthday."}
            </T>
            <DateField label="Birthday" value={born} onChange={setBorn} />
            <View style={{ gap: 4 }}>
              <T v="small">Baby's name (optional)</T>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Optional"
                placeholderTextColor={c.muted}
                maxLength={30}
                style={[s.input, { borderColor: c.line, backgroundColor: c.bg, color: c.ink }]}
              />
            </View>
            <View style={ui.row}>
              <Pill label={state.born ? "Save" : "Baby is here!"} primary onPress={save} />
              <Pill label="Cancel" onPress={onClose} />
            </View>
            {state.born ? (
              confirmUndo ? (
                <View style={{ gap: 8 }}>
                  <T v="small">Go back to the pregnancy countdown? Baby's birthday will be cleared.</T>
                  <View style={ui.row}>
                    <Pill label="Yes, go back" onPress={undo} />
                    <Pill label="Keep it" onPress={() => setConfirmUndo(false)} />
                  </View>
                </View>
              ) : (
                <Pressable onPress={() => setConfirmUndo(true)} accessibilityRole="button">
                  <T v="small" color="rose">Switch back to the pregnancy countdown</T>
                </Pressable>
              )
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 22, paddingHorizontal: 18, maxHeight: "90%" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, fontFamily: fonts.body, fontSize: 16 },
});
