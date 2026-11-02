import { registerRootComponent } from "expo";
import { Platform } from "react-native";
import App from "./App";

// Android widgets render through a background task that Android wakes up on its own schedule.
if (Platform.OS === "android") {
  const { registerWidgetTaskHandler } = require("react-native-android-widget");
  const { widgetTaskHandler } = require("./src/widgets/widgetTaskHandler");
  registerWidgetTaskHandler(widgetTaskHandler);
}

registerRootComponent(App);
