import { ExtensionStorage } from "@bacons/apple-targets";
import { snapshot, State } from "../lib/core";

// Shared with the widget through the App Group set in app.json and targets/widget.
export const APP_GROUP = "group.com.cynthiachuang.littlecountdown";
const storage = new ExtensionStorage(APP_GROUP);

/** Hands the widget a fresh snapshot and asks iOS to redraw it. */
export function syncWidgets(state: State): void {
  try {
    storage.set("snapshot", JSON.stringify(snapshot(state)));
    ExtensionStorage.reloadWidget();
  } catch {
    // The widget simply keeps its last snapshot.
  }
}
