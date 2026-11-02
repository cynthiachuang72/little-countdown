import { snapshot, State } from "../lib/core";

// Shared with the widget through the App Group set in app.json and targets/widget.
export const APP_GROUP = "group.com.cynthiachuang.littlecountdown";

// Loaded lazily: Expo Go doesn't include the widget's native code, so the app
// keeps working there and simply skips the widget.
let storage: { set: (k: string, v: string) => void } | null | undefined;
let reload: (() => void) | null = null;
function getStorage() {
  if (storage !== undefined) return storage;
  try {
    const { ExtensionStorage } = require("@bacons/apple-targets");
    storage = new ExtensionStorage(APP_GROUP);
    reload = () => ExtensionStorage.reloadWidget();
  } catch {
    storage = null;
  }
  return storage;
}

/** Hands the widget a fresh snapshot and asks iOS to redraw it. */
export function syncWidgets(state: State): void {
  try {
    const s = getStorage();
    if (!s) return;
    s.set("snapshot", JSON.stringify(snapshot(state)));
    reload?.();
  } catch {
    // The widget simply keeps its last snapshot.
  }
}
