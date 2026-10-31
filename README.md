# Dysregulation Tracker

A private, phone-first web app for checking in on dysregulation, emotional constipation, body signals and sleep, a few times a day. All data stays on your device (IndexedDB).

See [PLAN.md](PLAN.md) for the full design and milestones.

## Develop

```sh
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run build    # typecheck + production build into dist/
```

## Status

- [x] Milestone 1: check-in screen (11 symptoms 0–3, sleep, tags, release, note), several check-ins per day, morning/midday/evening slot tracking, edit/delete, back-fill past days, simple history list
- [ ] Milestone 2: calendar heatmap
- [ ] Milestone 3: export/import and spreadsheet import
- [ ] Milestone 4: PWA install/offline and 3× daily reminders
- [ ] Milestone 5: insights (trends and correlations)
- [ ] Milestone 6: AI note analysis
