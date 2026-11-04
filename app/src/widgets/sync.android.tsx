import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { activeLook, snapshot, State, widgetNumbers } from "../lib/core";
import { CountdownWidget, WIDGET_NAME } from "./CountdownWidget";

/** Redraws any Little Countdown widgets on the home screen with the latest data. */
export function syncWidgets(state: State): void {
  const nums = widgetNumbers(snapshot(state));
  requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: () => <CountdownWidget {...nums} sample={state.sample} look={activeLook(state)} />,
    widgetNotFound: () => {},
  }).catch(() => {});
}
