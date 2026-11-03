import { createContext } from "react";
import type { ThemeName } from "./lib/core";

/** The chosen look, provided by StoreProvider from the saved settings. */
export const ThemeContext = createContext<ThemeName>("calm");
