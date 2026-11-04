import { createContext } from "react";
import type { LookName } from "./lib/looks";

/** The look in use and whether baby has arrived, provided by StoreProvider from the saved settings. */
export const ThemeContext = createContext<{ look: LookName; born: boolean; tick: number }>({ look: "calm", born: false, tick: 0 });
