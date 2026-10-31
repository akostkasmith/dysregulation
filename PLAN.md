# Dysregulation Tracker — Plan

A private phone app for a daily check-in on dysregulation, emotional constipation, body signals and sleep, with insights that build up over time.

## What the old spreadsheet shows

- 25 entries (May–Aug 2024, plus one in Apr 2025).
- None of the 13 symptom columns or the sleep column was ever filled in. Only **Notes** was used. Ticking columns was too much effort, so a check-in has to be fast (under 30 s).
- The notes repeat a few themes:
  - **Sleep**: poor sleep, waking at 5am, getting up to pee at night.
  - **Triggers**: work performance, rejection by family, specific calls, a sick child, the new baby.
  - **Body**: neck pain, fighting a bug.
  - **Release events**: "had a big cry… the tap needed to be opened".
- The dates are messy. Excel swapped day and month in some rows (e.g. `06/04` became 6 April), and three May rows say 2025 when they were almost certainly 2024. The importer has to fix these.

## Decisions

| Area | Choice |
|---|---|
| Platform | Installable phone web app (PWA), works offline |
| Symptom input | 0–3 intensity taps (none / mild / moderate / strong) |
| Storage | On-device only (IndexedDB), with export/import files for backup |
| Insights | Stats and correlations run locally; optional AI analysis of notes with Claude |
| Symptoms | Overlapping ones merged: 13 → 11 |
| Check-ins | At least once a day, as many more as you like (timestamped) |
| Reminders | 3× a day: morning, midday, evening |

## Symptoms (11, merged from the spreadsheet's 13)

| Symptom | Merged from |
|---|---|
| Anxiety | |
| Can't relax | |
| Highly irritable | |
| Unsafe / threatened | Threatened + Lack of safety |
| Disconnected from emotions | |
| Brain fog / forgetful | Brain fog + Bad memory |
| Unexplained tiredness | |
| Focused on body issues | |
| Overactive bladder | |
| Bloated | |
| Eye irritation | |

*Anxiety* and *Can't relax* stay separate. One is worry, the other is body tension, and they can come apart. You can rename, reorder, hide or add symptoms in Settings.

## Check-ins (one screen, as many per day as you like)

Each check-in is timestamped. A day's summary takes the **peak** intensity of each symptom across that day's check-ins. The **load score** is the sum of those peaks.

1. **"All good right now"** button: logs every symptom as 0 in one tap.
2. **Symptoms**: 11 rows, each with 4 tap targets (0–3).
3. **Sleep** (once per day, shown on the first check-in of the day): 1–5 quality rating, wake time, number of times you got up at night.
4. **Triggers/context tags**: multi-select chips (Work, Family, Kids, Partner, Health/illness, Sleep, Conflict, Social, Money). You can add your own.
5. **Release**: a toggle for "had a cry / vented / let it out".
6. **Note**: free text.
7. Today's earlier check-ins are listed under the form and can be edited or deleted. You can back-fill past days.

## Screens

- **Today**: the check-in above.
- **History**: calendar heatmap coloured by a daily *load score* (sum of intensities). Tap a day to see or edit it.
- **Insights**: see below.
- **Settings**: manage symptoms and tags, set a daily reminder time, export/import (JSON + CSV), import the old .xlsx/.csv, and enter an AI API key.

## Insights

**Tier 1: descriptive (from day 1)**
- Logging streak, entries this month.
- Load score trend (7-day rolling average).
- Most frequent and most intense symptoms in the last 7 and 30 days.

**Tier 2: correlations (after about 3–4 weeks of data)**
- Sleep vs. next-day symptoms ("after sleep ≤2, Anxiety averages 2.1 vs 0.8").
- Tag vs. symptoms, same day and the day after ("Work days go with Irritability").
- Symptom clusters: which symptoms rise together.
- Release events: does the load drop in the 1–3 days after a cry?
- Results come in plain sentences with sample sizes. Below a minimum *n* they're hidden or marked "early signal". These show association, not cause.

**Tier 3: AI note analysis (optional, opt-in)**
- Uses your own Anthropic API key, stored only on the device. The app calls the API straight from the browser, with no server in between.
- **Weekly reflection**: summarises the week's notes and numbers, names recurring themes, and points to possible trigger→symptom links.
- **Theme extraction**: suggests tags for past notes, which you accept or reject.
- **Privacy**: note text and scores are sent to the API only when you tap "Analyze". The app shows exactly what will be sent before it goes. It is not therapy and doesn't give medical advice.

## Data model (IndexedDB via Dexie)

```ts
CheckIn {
  id: string;
  at: number;              // timestamp
  date: string;            // YYYY-MM-DD (indexed)
  symptoms: Record<symptomId, 0|1|2|3>;
  tags: tagId[];
  release: boolean;
  note: string;
  updatedAt: number;
}
Sleep { date (PK), quality: 1..5, wakeTime?: string, nightWakings?: number }
Symptom  { id, label, order, hidden }
Tag      { id, label, order, hidden }
Reflection { id, weekStart, text, createdAt }   // saved AI output
Settings { reminderTimes: ["08:00","13:00","20:00"], apiKey?, ... }
```

## Tech stack

- Vite + React + TypeScript
- Dexie (IndexedDB) for storage
- `vite-plugin-pwa` for installability and offline use
- Plain SVG/small chart lib for the heatmap and trends
- Insight maths as pure functions in TypeScript, unit-tested with Vitest
- Hosted for free on GitHub Pages. It's a static site, so your data never touches the host.

## Reminders (3× a day)

The defaults are 08:00 (morning, includes sleep), 13:00 (midday) and 20:00 (evening). You can change them in Settings.

A web app can't reliably schedule notifications by itself while it's closed. It would need a push server, and that clashes with keeping everything on-device. So:

- **Main route**: Settings creates a calendar file (`.ics`) with three daily repeating events at your times. Each event links to the app. Your phone's calendar then does the reliable reminding.
- **Bonus**: while the app is open or in the background, it shows a notification at each reminder time, where the platform allows.
- The app also shows which of today's three slots you've already checked in for.

## Milestones

1. **Scaffold and check-in**: project setup, data model, Today screen, local save. *(usable day 1)*
2. **History**: calendar heatmap, day detail and edit, back-fill.
3. **Data safety**: JSON/CSV export and import, plus the old spreadsheet import with date fixes.
4. **PWA**: installable, offline, reminders.
5. **Insights tier 1 and tier 2**.
6. **AI tier 3**: API key setting, weekly reflection, tag suggestions.

