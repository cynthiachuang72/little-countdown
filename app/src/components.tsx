import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from "@react-native-community/datetimepicker";
import React from "react";
import { Platform, Pressable, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from "react-native";
import { fmt, iso, parse } from "./lib/core";
import { type Palette, usePalette } from "./theme";

// ---------- type ----------
type Variant = "display" | "title" | "h2" | "body" | "strong" | "small" | "label";
export function T({ v = "body", color, style, ...rest }: TextProps & { v?: Variant; color?: keyof Palette }) {
  const { c, f: fonts, illustrated } = usePalette();
  const base: Record<Variant, TextStyle> = {
    // Lining numbers keep every digit the same height; the extra line height leaves room for the serif's tall glyphs.
    display: { fontFamily: fonts.display, fontSize: illustrated ? 56 : 54, lineHeight: 72, paddingTop: 4, fontVariant: ["lining-nums", "tabular-nums"] },
    title: { fontFamily: fonts.display, fontSize: illustrated ? 28 : 26, lineHeight: 34 },
    h2: { fontFamily: fonts.display, fontSize: 21, lineHeight: 28 },
    body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
    strong: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
    small: { fontFamily: fonts.semi, fontSize: 13, lineHeight: 18 },
    label: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  };
  const defaultColor: keyof Palette = v === "small" || v === "label" ? "muted" : "ink";
  return <Text {...rest} style={[base[v], { color: c[color || defaultColor] }, style]} />;
}

// ---------- surfaces & buttons ----------
export function Card({ style, children, tone = "surface" }: { style?: StyleProp<ViewStyle>; children: React.ReactNode; tone?: keyof Palette }) {
  const { c, r } = usePalette();
  return <View style={[{ backgroundColor: c[tone], borderRadius: r, padding: 18, gap: 12 }, style]}>{children}</View>;
}

export function Pill({ label, onPress, primary, done, accessibilityLabel }: { label: string; onPress: () => void; primary?: boolean; done?: boolean; accessibilityLabel?: string }) {
  const { c, f: fonts, illustrated } = usePalette();
  const bgPrimary = illustrated ? c.rose : c.ink;
  const bg = done ? c.sage : primary ? bgPrimary : c.surface;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: bg, borderColor: primary || done ? bg : c.line, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: primary || done ? c.surface : c.ink }}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ onPress, label, children }: { onPress: () => void; label: string; children: React.ReactNode }) {
  const { c } = usePalette();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => [styles.icon, { borderColor: c.line, backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}>
      {children}
    </Pressable>
  );
}

export function Remove({ onPress, label }: { onPress: () => void; label: string }) {
  const { c, f: fonts } = usePalette();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={"Remove " + label} hitSlop={10} style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ fontSize: 20, color: c.muted, fontFamily: fonts.bold }}>×</Text>
    </Pressable>
  );
}

export function Tag({ text, tone }: { text: string; tone: "auto" | "off" | "mine" }) {
  const { c, f: fonts } = usePalette();
  const map = { auto: [c.bg, c.muted], off: [c.sageSoft, c.sage], mine: [c.roseSoft, c.rose] } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: fg, fontFamily: fonts.heavy, fontSize: 11 }}>{text}</Text>
    </View>
  );
}

// ---------- date & time fields ----------
const longDate: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" };

export function DateField({ label, value, onChange, optional }: { label: string; value: string | null; onChange: (v: string | null) => void; optional?: boolean }) {
  const { c, dark } = usePalette();
  const date = value ? parse(value) : new Date();
  const handle = (e: DateTimePickerEvent, d?: Date) => { if (e.type === "set" && d) onChange(iso(d)); };

  if (Platform.OS === "android") {
    return (
      <View style={{ gap: 4, flex: 1 }}>
        <T v="small">{label}</T>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => DateTimePickerAndroid.open({ value: date, mode: "date", onChange: handle })}
            style={[styles.field, { borderColor: c.line, backgroundColor: c.bg, flex: 1 }]}
          >
            <T color={value ? "ink" : "muted"}>{value ? fmt(parse(value), longDate) : "Choose a date"}</T>
          </Pressable>
          {optional && value ? <Remove label={label} onPress={() => onChange(null)} /> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 4, flex: 1 }}>
      <T v="small">{label}</T>
      {value ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <DateTimePicker
            value={date}
            mode="date"
            display="compact"
            themeVariant={dark ? "dark" : "light"}
            accentColor={c.rose}
            onChange={handle}
          />
          {optional ? <Remove label={label} onPress={() => onChange(null)} /> : null}
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => onChange(iso(new Date()))}
          style={[styles.field, { borderColor: c.line, backgroundColor: c.bg }]}>
          <T color="muted">Add a date</T>
        </Pressable>
      )}
    </View>
  );
}

export function TimeField({ label, hour, minute, onChange }: { label: string; hour: number; minute: number; onChange: (h: number, m: number) => void }) {
  const { c, dark } = usePalette();
  const value = new Date(2000, 0, 1, hour, minute);
  const handle = (e: DateTimePickerEvent, d?: Date) => { if (e.type === "set" && d) onChange(d.getHours(), d.getMinutes()); };
  const text = value.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <T v="small">{label}</T>
      {Platform.OS === "android" ? (
        <Pressable accessibilityRole="button" onPress={() => DateTimePickerAndroid.open({ value, mode: "time", onChange: handle })}
          style={[styles.field, { borderColor: c.line, backgroundColor: c.bg }]}>
          <T>{text}</T>
        </Pressable>
      ) : (
        <DateTimePicker value={value} mode="time" display="compact" themeVariant={dark ? "dark" : "light"} accentColor={c.rose} onChange={handle} />
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, minHeight: 42, justifyContent: "center", alignItems: "center" },
  icon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  field: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, justifyContent: "center" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" },
});
