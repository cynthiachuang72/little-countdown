import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { addDays, diff, iso, joyFor, parse, plural, State, today } from "./lib/core";

const PREFIX = "joy-";
const CHANNEL = "daily-joy";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Asks for notification permission. Returns true when reminders can be shown. */
export async function askPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Daily little joy",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Queues one gentle morning reminder for each of the next 14 days, each with that day's little joy.
 * Runs whenever the app opens or the person changes something, so the queue never runs dry for long.
 */
export async function scheduleReminders(state: State): Promise<void> {
  try {
    const queued = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      queued.filter((n) => n.identifier.startsWith(PREFIX)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    if (!state.reminder.on || state.sample) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;

    const now = new Date();
    const t = today(now);
    const due = parse(state.due), leave = parse(state.leave);
    for (let i = 0; i < 14; i++) {
      const day = addDays(t, i);
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), state.reminder.hour, state.reminder.minute);
      if (at <= now) continue;
      const bd = Math.max(0, diff(day, due)), ld = diff(day, leave);
      const title =
        bd === 0 ? "Due date today" : ld === 0 ? "Maternity leave starts today" :
        ld > 0 ? `${bd} ${plural(bd, "day")} to baby · ${ld} to leave` : `${bd} ${plural(bd, "day")} to baby`;
      await Notifications.scheduleNotificationAsync({
        identifier: PREFIX + iso(day),
        content: { title, body: joyFor(state, iso(day)).text },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
      });
    }
  } catch {
    // Reminders are a nice-to-have; never let them break the app.
  }
}
