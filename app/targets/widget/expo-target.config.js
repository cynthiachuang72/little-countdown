/** iPhone home and lock screen widget, built by @bacons/apple-targets during `expo prebuild` / EAS Build. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "LittleCountdownWidget",
  displayName: "Little Countdown",
  icon: "../../assets/icon.png",
  deploymentTarget: "17.0",
  colors: {
    $accent: "#C9738B",
    $widgetBackground: { light: "#FBFCFE", dark: "#202535" },
  },
  entitlements: {
    "com.apple.security.application-groups": config.ios.entitlements["com.apple.security.application-groups"],
  },
});
