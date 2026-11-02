# Little Countdown

A calm countdown to baby's arrival and the start of maternity leave.

- Days until the due date and until leave, with workdays left
- Pregnancy week with a size comparison and trimester progress bar
- A "little joy" idea each day, with a streak for the ones you do
- Your own things to look forward to, dated or "someday"
- Holidays and PTO that come out of the workday count, with one-tap US public holidays
- A compact widget view at `#widget`

## Turn on the web address

Settings → Pages → Deploy from a branch → `main` / `(root)` → Save. After a minute the app lives at
`https://cynthiachuang72.github.io/little-countdown/`.

## Install it as an app

**iPhone:** open the address in Safari → Share → Add to Home Screen.
**Android:** open the address in Chrome → ⋮ → Install app (or Add to Home screen).

It opens full screen with its own icon and keeps working offline after the first visit.
Your dates and lists are saved on each phone separately.

## iPhone widget (home and lock screen)

iPhone doesn't let web apps add widgets, so the widget runs in the free [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) app.

1. Install Scriptable.
2. In Little Countdown, tap the grid icon, then **Copy widget script**. In Scriptable, tap **+**, paste, and name the script `Little Countdown`.
   (Or open [`scriptable/Little Countdown.js`](scriptable/Little%20Countdown.js), tap Raw, and copy all.)
3. Long-press your home screen → **+** → Scriptable → pick small or medium → Add Widget.
   For the lock screen: long-press the lock screen → Customize → Lock Screen → add a Scriptable widget.
4. Tap the widget while editing → Script: **Little Countdown** → When Interacting: **Open URL** with your app's address.
5. Back in the app's widget view, tap **Copy widget code** and paste it into the widget's **Parameter** field.

Copy the widget code again whenever you change your dates or days off.

## Android widget

Android Chrome can install the app but can't add a web app widget. A native Android widget is the next step (a small Kotlin project with a Glance widget).

## App Store and Google Play version

The native iPhone and Android app lives in [`app/`](app/). It's built with React Native (Expo) and has
real widgets on both phones plus morning reminders. See [`app/README.md`](app/README.md) to build and release it.

## Files

- `index.html` — the whole app (HTML, CSS, JavaScript; no build step)
- `manifest.webmanifest`, `sw.js`, `icons/` — install and offline support
- `scriptable/Little Countdown.js` — the iPhone widget
