# Little Countdown — iPhone & Android app

The App Store / Google Play version of Little Countdown, built with React Native and Expo.

**What's in it:** countdowns to baby and to leave (with workdays left), pregnancy week and size,
a daily little joy with a streak, your own things to look forward to, days off and US holidays,
a morning reminder notification, and home + lock screen widgets on both iPhone and Android.
All data stays on the phone.

## Project layout

| Path | What it is |
| --- | --- |
| `App.tsx`, `index.ts` | App entry; registers the Android widget task |
| `src/lib/core.ts` | All countdown logic (shared by the app, widgets and reminders) |
| `src/Home.tsx`, `src/Settings.tsx` | The screens |
| `src/notifications.ts` | Morning reminders (next 14 days, refreshed whenever the app opens) |
| `src/widgets/` | Android widget, and the code that sends data to both widgets |
| `targets/widget/` | iPhone widget (SwiftUI, WidgetKit) |
| `app.json`, `eas.json` | App name, IDs, icons, build settings |

## Try it in Expo Go (no computer needed)

Every push to `main` that changes `app/` runs **Publish update to Expo** in GitHub Actions. Open the
run on the Actions tab: its summary shows an `exp://…` link. Open that link in Safari on your iPhone
and it launches in Expo Go. You can also open the project on expo.dev → Updates → newest update.

The workflow needs an `EXPO_TOKEN` secret (Settings → Secrets and variables → Actions).
Widgets don't run in Expo Go; everything else does.

## Before the first build

1. **Expo account** (free): sign up at expo.dev.
2. **Apple Developer Program** ($99/year): enroll at developer.apple.com/programs.
   Once approved, find your **Team ID** under Membership details and put it in `app.json`
   in place of `YOUR_TEAM_ID` (or send it to Claude to update).
3. **Google Play Console** ($25 once): sign up at play.google.com/console.

## Building (needs a computer once, Mac or Windows)

```bash
cd app
npm install
npx expo install --fix     # lines package versions up with the current Expo SDK
npx eas-cli@latest login
npx eas-cli@latest init    # links the project to your Expo account (fills in projectId)

# A test build you can install on your own phones
npx eas-cli@latest build --profile preview --platform android   # gives an .apk link
npx eas-cli@latest build --profile production --platform ios    # then:
npx eas-cli@latest submit --platform ios                         # sends it to TestFlight
```

Builds run on Expo's servers, so no Xcode or Android Studio is needed. The first iOS build asks
you to sign in to Apple; EAS then creates the certificates and the App Group for the widget.

After `eas init`, you can also connect the GitHub repo on expo.dev (Project → GitHub, base
directory `app`) and start builds from the website on your phone.

If a build fails, copy the error from the build page on expo.dev and paste it to Claude.

## Releasing

**iPhone:** in App Store Connect, add screenshots, a description, a privacy policy link and the
privacy answers ("Data not collected"), pick the TestFlight build, and submit for review.

**Android:** `npx eas-cli@latest build --profile production --platform android`, upload the `.aab`
to a **closed testing** track in Play Console, and keep at least 12 testers opted in for
14 days in a row. Then apply for production access and publish.

Both stores need a privacy policy web page. Because nothing leaves the phone, it can be short.

## Notes

- Package versions target Expo SDK 54. `npx expo install --fix` updates them to match.
- The widgets read a small summary (dates, days off, the next 3 weeks of little joys) that the app
  saves whenever it opens or something changes, and they recalculate the countdown each midnight.
- The app shows a "not medical advice" line, which helps with store review for pregnancy apps.
