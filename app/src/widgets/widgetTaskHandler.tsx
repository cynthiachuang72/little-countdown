import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { snapshot, widgetNumbers } from "../lib/core";
import { loadState } from "../persist";
import { CountdownWidget, WIDGET_NAME } from "./CountdownWidget";

/** Android calls this in the background when a widget is added, resized or due for a refresh. */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== WIDGET_NAME) return;
  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const state = await loadState();
      const nums = widgetNumbers(snapshot(state));
      props.renderWidget(<CountdownWidget {...nums} sample={state.sample} />);
      break;
    }
    default:
      break;
  }
}
