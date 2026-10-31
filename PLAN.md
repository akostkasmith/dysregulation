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

## Daily check-in (one screen)

1. **"All good today"** button: logs every symptom as 0 in one tap.
2. **Symptoms**: 13 rows, each with 4 tap targets (0–3). The defaults are the spreadsheet's 13 symptoms. You can rename, reorder, hide or add your own.
   - Overactive bladder, Can't relax, Highly irritable, Threatened, Unexplained tiredness, Bloated, Lack of safety, Bad memory, Eye irritation, Focused on body issues, Brain fog, Disconnected from emotions, Anxiety
3. **Sleep**: 1–5 quality rating, optional wake time, optional "woke up to pee ×N".
4. **Triggers/context tags**: multi-select chips (Work, Family, Kids, Partner, Health/illness, Sleep, Conflict, Social, Money). You can add your own.
5. **Release**: a toggle for "had a cry / vented / let it out".
6. **Note**: free text.
7. Opening a day that's already logged edits it. You can also back-fill earlier days.

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
Entry {
  date: string;            // YYYY-MM-DD, primary key (one entry per day)
  symptoms: Record<symptomId, 0|1|2|3>;
  sleepQuality?: 1..5;
  wakeTime?: string;       // HH:MM
  nightWakings?: number;
  tags: tagId[];
  release: boolean;
  note: string;
  createdAt, updatedAt: number;
}
Symptom  { id, label, order, hidden }
Tag      { id, label, order, hidden }
Reflection { id, weekStart, text, createdAt }   // saved AI output
Settings { reminderTime?, apiKey?, ... }
```

## Tech stack

- Vite + React + TypeScript
- Dexie (IndexedDB) for storage
- `vite-plugin-pwa` for installability and offline use
- Plain SVG/small chart lib for the heatmap and trends
- Insight maths as pure functions in TypeScript, unit-tested with Vitest
- Hosted for free on GitHub Pages. It's a static site, so your data never touches the host.

## Reminders

PWA notifications are limited, especially on iOS. That means two things:

- A daily local notification where the platform supports it.
- A fallback: add a phone calendar/alarm reminder that opens the app's URL.

## Milestones

1. **Scaffold and check-in**: project setup, data model, Today screen, local save. *(usable day 1)*
2. **History**: calendar heatmap, day detail and edit, back-fill.
3. **Data safety**: JSON/CSV export and import, plus the old spreadsheet import with date fixes.
4. **PWA**: installable, offline, reminders.
5. **Insights tier 1 and tier 2**.
6. **AI tier 3**: API key setting, weekly reflection, tag suggestions.

## Open questions

- Keep the 13 symptoms as they are, or trim or merge some (e.g. "Threatened" and "Lack of safety")?
- Should one check-in per day be enough, or do you want optional extra "moment" logs during the day?
- What reminder time suits you?
