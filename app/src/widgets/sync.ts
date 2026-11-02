import type { State } from "../lib/core";

// Fallback for platforms without a home screen widget. The iOS and Android
// versions live in sync.ios.ts and sync.android.tsx; Metro picks the right one.
export function syncWidgets(_state: State): void {}
