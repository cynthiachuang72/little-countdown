import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { normalize, SAMPLE, State } from "./lib/core";
import { loadState, saveState } from "./persist";
import { syncWidgets } from "./widgets/sync";
import { scheduleReminders } from "./notifications";

type Ctx = {
  state: State;
  ready: boolean;
  update: (fn: (s: State) => State) => void;
  /** Bumps once a minute and when the app returns to the foreground, so "today" stays current. */
  tick: number;
};
const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(() => normalize(SAMPLE));
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      setReady(true);
      // Refresh widgets and reminders on launch, so a new day's joys are queued.
      syncWidgets(s);
      scheduleReminders(s);
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    const sub = AppState.addEventListener("change", (st) => { if (st === "active") setTick((t) => t + 1); });
    return () => { clearInterval(id); sub.remove(); };
  }, []);

  const update = useCallback((fn: (s: State) => State) => {
    setState((prev) => {
      const next = fn(prev);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveState(next);
        syncWidgets(next);
        scheduleReminders(next);
      }, 400);
      return next;
    });
  }, []);

  return <StoreContext.Provider value={{ state, ready, update, tick }}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const newId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
