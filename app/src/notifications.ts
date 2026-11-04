import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { addDays, apptAt, babyAge, diff, iso, joyFor, nextBabyMilestone, parse, plural, State, timeLabel, today, upcomingAppts } from "./lib/core";

const PREFIX = "joy-";
const APPT_PREFIX = "appt-";
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
      queued
        .filter((n) => n.identifier.startsWith(PREFIX) || n.identifier.startsWith(APPT_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    if (state.sample) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;

    const now = new Date();
    if (state.apptRemind) await scheduleAppointments(state, now);
    if (!state.reminder.on) return;

    const t = today(now);
    const due = parse(state.due), leave = parse(state.leave);
    for (let i = 0; i < 14; i++) {
      const day = addDays(t, i);
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), state.reminder.hour, state.reminder.minute);
      if (at <= now) continue;
      const bd = Math.max(0, diff(day, due)), ld = diff(day, leave);
      const born = state.born ? parse(state.born) : null;
      const next = born ? nextBabyMilestone(born, day) : null;
      const babyTitle = born
        ? (() => {
            const a = babyAge(born, day), who = state.babyName || "Baby";
            const nd = next ? diff(day, next.date) : -1;
            if (nd === 0) return next!.title.includes("birthday") ? `It's ${who}'s ${next!.title.toLowerCase()}!` : `${who} is ${next!.title} today`;
            return `${who} is ${a.num} ${a.unit}` + (next ? ` · ${nd} ${plural(nd, "day")} to ${next.title}` : "");
          })()
        : null;
      const title = babyTitle ?? (
        bd === 0 ? "Due date today" : ld === 0 ? "Maternity leave starts today" :
        ld > 0 ? `${bd} ${plural(bd, "day")} to baby · ${ld} to leave` : `${bd} ${plural(bd, "day")} to baby`);
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

/** The evening before (7 pm) and, for timed ones, an hour before each upcoming appointment. */
async function scheduleAppointments(state: State, now: Date) {
  const soon = upcomingAppts(state, today(now)).slice(0, 20);
  for (const a of soon) {
    const at = apptAt(a);
    const day = parse(a.date);
    const where = a.place ? ` · ${a.place}` : "";
    const eve = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1, 19, 0);
    if (eve > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: APPT_PREFIX + a.id + "-eve",
        content: { title: `Tomorrow: ${a.title}`, body: (a.time ? timeLabel(a.time) : "Time not set") + where },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: eve, channelId: CHANNEL },
      });
    }
    const hour = new Date(at.getTime() - 60 * 60 * 1000);
    if (a.time && hour > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: APPT_PREFIX + a.id + "-hr",
        content: { title: `${a.title} in an hour`, body: `${timeLabel(a.time)}${where}` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: hour, channelId: CHANNEL },
      });
    }
  }
}
