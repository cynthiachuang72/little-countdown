import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalize, SAMPLE, State } from "./lib/core";

export const STORAGE_KEY = "little-countdown-v1";

export async function loadState(): Promise<State> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : normalize(SAMPLE);
  } catch {
    return normalize(SAMPLE);
  }
}

export async function saveState(state: State): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}
