# Daily — 4 Pillars

A daily check-in app modelled on the 4 Pillars layout: check off two habits under
each pillar every day, track your progress over time, and keep your goals and
prayers in one place.

No build step, no server, no account. It's plain HTML/CSS/JavaScript, and all of
your data stays in your own browser (`localStorage`).

## Features

**Daily checkboxes** — the same eight, in the same four pillars:

| Pillar  | Checkboxes                |
|---------|---------------------------|
| Faith   | Read bible, Prayer        |
| Family  | Marriage, Relationship    |
| Fitness | Exercise, Nutrition       |
| Finance | Learn, Plan               |

A pillar turns gold when both of its boxes are checked, and its counter flips to
`✓✓ 2/2`.

**Bonus points** — *Add Gratitude* and *Add Journal*, one bonus point each per day.

**Tracked progress**
- 1 point per checkbox + 1 per bonus type = **10 points max per day**.
- The chart shows the last 7 days (Daily), last 6 weeks (Weekly), or last 6 months
  (Monthly), with a blue goal line at 8 points a day.
- Header badges show your all-time points and your current daily streak.
- Use `‹` / `›` to look at — and back-fill — previous days. Tap the date to jump
  back to today.

**Goals** — type a goal, tag it to a pillar, check it off when it's done, edit or
delete it later.

**Prayers** — write a prayer with an optional "who/what", mark it answered when it
is, and keep the whole list as a record.

**Search** filters goals, prayers, and today's gratitude/journal entries.

**Export / Import / Reset** at the bottom of the page — export writes a JSON
backup you can import on another device.

## Running it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Putting it on your phone

1. Enable GitHub Pages for this repo (Settings → Pages → deploy from the branch,
   root folder).
2. Open the published URL on your phone.
3. **iPhone:** Share → *Add to Home Screen*. **Android:** menu → *Install app*.

It then opens full-screen like a native app and works offline — a service worker
(`sw.js`) caches the files, and a web app manifest supplies the icon and theme.

## Files

```
index.html            markup for the whole screen
styles.css            dark + gold theme
app.js                state, scoring, streak, chart, goals, prayers
manifest.webmanifest  PWA metadata (installable, standalone)
sw.js                 offline cache
assets/               app icons
```

## Notes on your data

Everything is stored only in the browser on the device you use. Clearing your
browser's site data erases it, and it does not sync between devices — use
**Export data** on one device and **Import** on the other. Nothing is ever sent
anywhere.

## Customising the checkboxes

The pillars and their checkboxes are defined at the top of `app.js` in the
`PILLARS` array. Add, rename, or remove entries there and the UI, scoring, and
chart follow automatically (`DAY_MAX` recalculates from the list; adjust
`DAY_TARGET` if you want a different goal line).
