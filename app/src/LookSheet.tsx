import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LookArt } from "./art";
import { Pill, T } from "./components";
import { activeLook } from "./lib/core";
import { BABY_LOOKS, FONTS, isNight, LOOK_INFO, type LookName, paletteFor, PREGNANCY_LOOKS, STORY } from "./lib/looks";
import { useStore } from "./store";
import { usePalette } from "./theme";

/** Cards for each look in the current chapter (pregnancy or after birth). Tapping one switches right away. */
export function LookPicker() {
  const { c } = usePalette();
  const scheme = useColorScheme();
  const { state, update } = useStore();
  const born = !!state.born;
  const current = activeLook(state);
  const list = born ? BABY_LOOKS : PREGNANCY_LOOKS;

  const choose = (name: LookName) =>
    // A look picked after birth only lasts while baby is here; picking a pregnancy look resets it.
    update((s) => (born ? { ...s, babyTheme: name } : { ...s, theme: name, babyTheme: null }));

  return (
    <View style={{ gap: 10 }}>
      <View style={s.grid}>
        {list.map((name) => {
          const on = current === name;
          const { c: pc } = paletteFor(name, born, scheme === "dark");
          return (
            <Pressable
              key={name}
              onPress={() => choose(name)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={LOOK_INFO[name].label + " look"}
              style={({ pressed }) => [s.card, { backgroundColor: pc.bg, borderColor: on ? c.rose : c.line, opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[s.preview, { backgroundColor: pc.surface }]}>
                {name === "calm" ? (
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <View style={[s.swatch, { backgroundColor: pc.roseSoft }]}><T style={{ color: pc.rose, fontFamily: FONTS.calm.display, fontSize: 18 }}>81</T></View>
                    <View style={[s.swatch, { backgroundColor: pc.sageSoft }]}><T style={{ color: pc.sage, fontFamily: FONTS.calm.display, fontSize: 18 }}>53</T></View>
                  </View>
                ) : (
                  <LookArt look={name} week={30} months={4} night={(name === "sky" || name === "starlight") && isNight()} bg={pc.surface} width={110} height={66} />
                )}
              </View>
              <T style={{ fontFamily: FONTS[name].display, fontSize: 17, lineHeight: 22, color: pc.ink }}>{LOOK_INFO[name].label}{on ? "  ✓" : ""}</T>
              <T v="small" style={{ color: pc.muted }}>{LOOK_INFO[name].note}</T>
            </Pressable>
          );
        })}
      </View>
      <T v="small">
        {born
          ? "You can switch any time."
          : `After baby arrives, ${LOOK_INFO[state.theme].label} becomes ${LOOK_INFO[STORY[state.theme]].label}. You can change that later.`}
      </T>
    </View>
  );
}

export default function LookSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityLabel="Close" />
      <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
        <View style={[s.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + 22 }]}>
          <ScrollView contentContainerStyle={{ gap: 14 }}>
            <T v="h2">Look</T>
            <LookPicker />
            <View style={{ flexDirection: "row" }}><Pill label="Done" primary onPress={onClose} /></View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 22, paddingHorizontal: 18, maxHeight: "90%" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", flexGrow: 1, borderWidth: 2, borderRadius: 18, padding: 10, gap: 4 },
  preview: { height: 76, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  swatch: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
