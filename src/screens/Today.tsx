import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, newId } from '../db';
import type { CheckIn, Intensity } from '../types';
import IntensityRow from '../components/IntensityRow';
import SleepCard from '../components/SleepCard';
import { formatDayLabel, fromDateAndTime, toDateKey, toTimeString } from '../lib/dates';
import { slotsCovered, summarizeDay } from '../lib/summary';

const SLOT_NAMES = ['Morning', 'Midday', 'Evening'];

interface Draft {
  id?: string;
  time: string;
  symptoms: Record<string, Intensity>;
  tags: string[];
  release: boolean;
  note: string;
}

const blankDraft = (): Draft => ({
  time: toTimeString(new Date()),
  symptoms: {},
  tags: [],
  release: false,
  note: '',
});

export default function Today({ date, onDateChange }: { date: string; onDateChange: (d: string) => void }) {
  const symptoms = useLiveQuery(() => db.symptoms.orderBy('order').filter((s) => !s.hidden).toArray(), []);
  const tags = useLiveQuery(() => db.tags.orderBy('order').filter((t) => !t.hidden).toArray(), []);
  const settings = useLiveQuery(() => db.settings.get('settings'), []);
  const sleep = useLiveQuery(async () => (await db.sleep.get(date)) ?? null, [date]);
  const checkIns = useLiveQuery(() => db.checkIns.where('date').equals(date).sortBy('at'), [date]);

  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [toast, setToast] = useState<string | null>(null);

  // Reset the form when switching day.
  useEffect(() => setDraft(blankDraft()), [date]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const today = toDateKey(new Date());
  const isToday = date === today;
  const summary = useMemo(() => (checkIns ? summarizeDay(date, checkIns) : null), [date, checkIns]);
  const covered = useMemo(
    () => (settings && checkIns ? slotsCovered(settings.reminderTimes, checkIns) : []),
    [settings, checkIns],
  );
  const symptomLabel = useMemo(
    () => Object.fromEntries((symptoms ?? []).map((s) => [s.id, s.label])),
    [symptoms],
  );
  const tagLabel = useMemo(() => Object.fromEntries((tags ?? []).map((t) => [t.id, t.label])), [tags]);

  if (!symptoms || !tags || !settings || !checkIns || sleep === undefined) return null;

  const fullSymptoms = (src: Record<string, Intensity>) =>
    Object.fromEntries(symptoms.map((s) => [s.id, src[s.id] ?? 0])) as Record<string, Intensity>;

  async function save(d: Draft) {
    const at = fromDateAndTime(date, d.time);
    const existing = d.id ? checkIns!.find((c) => c.id === d.id) : undefined;
    const entry: CheckIn = {
      id: d.id ?? newId(),
      at,
      date,
      // Keep values for symptoms that are hidden now but were logged before.
      symptoms: { ...existing?.symptoms, ...fullSymptoms(d.symptoms) },
      tags: d.tags,
      release: d.release,
      note: d.note.trim(),
      updatedAt: Date.now(),
    };
    await db.checkIns.put(entry);
    setDraft(blankDraft());
    setToast(d.id ? 'Check-in updated' : 'Check-in saved');
  }

  async function allGood() {
    await save({ ...blankDraft(), time: draft.time, note: draft.note, tags: draft.tags });
  }

  function edit(c: CheckIn) {
    setDraft({
      id: c.id,
      time: toTimeString(c.at),
      symptoms: { ...c.symptoms },
      tags: [...c.tags],
      release: c.release,
      note: c.note,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(c: CheckIn) {
    if (!confirm(`Delete the ${toTimeString(c.at)} check-in?`)) return;
    await db.checkIns.delete(c.id);
    if (draft.id === c.id) setDraft(blankDraft());
  }

  const shift = (days: number) => {
    const [y, m, d] = date.split('-').map(Number);
    const next = toDateKey(new Date(y, m - 1, d + days));
    if (next <= today) onDateChange(next);
  };

  const draftLoad = Object.values(draft.symptoms).reduce<number>((a, b) => a + b, 0);

  return (
    <>
      <header className="screen-header">
        <div className="day-nav">
          <button type="button" className="icon-btn" aria-label="Previous day" onClick={() => shift(-1)}>
            ‹
          </button>
          <label className="day-title">
            <h1>{formatDayLabel(date, today)}</h1>
            <input
              type="date"
              className="sr-date"
              value={date}
              max={today}
              aria-label="Choose day"
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="icon-btn"
            aria-label="Next day"
            disabled={isToday}
            onClick={() => shift(1)}
          >
            ›
          </button>
        </div>
        <ul className="slots" aria-label="Check-ins by time of day">
          {settings.reminderTimes.map((t, i) => (
            <li key={t} className={covered[i] ? 'slot done' : 'slot'}>
              <span className="dot" aria-hidden />
              {SLOT_NAMES[i] ?? t}
              <span className="sr-only">{covered[i] ? ' done' : ' not yet'}</span>
            </li>
          ))}
        </ul>
      </header>

      <SleepCard key={date} date={date} sleep={sleep} />

      <section className="card">
        <div className="card-head">
          <h2>{draft.id ? 'Edit check-in' : 'How are you right now?'}</h2>
          <input
            type="time"
            className="time-input"
            aria-label="Time of check-in"
            value={draft.time}
            onChange={(e) => e.target.value && setDraft({ ...draft, time: e.target.value })}
          />
        </div>

        {!draft.id && (
          <button type="button" className="btn all-good" onClick={allGood}>
            All good right now
          </button>
        )}

        <div className="intensity-legend" aria-hidden>
          <span>0 none</span>
          <span>1 mild</span>
          <span>2 moderate</span>
          <span>3 strong</span>
        </div>
        {symptoms.map((s) => (
          <IntensityRow
            key={s.id}
            label={s.label}
            value={draft.symptoms[s.id] ?? 0}
            onChange={(v) => setDraft({ ...draft, symptoms: { ...draft.symptoms, [s.id]: v } })}
          />
        ))}

        <h3>What's going on?</h3>
        <div className="chips">
          {tags.map((t) => {
            const on = draft.tags.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                className={on ? 'chip on' : 'chip'}
                onClick={() =>
                  setDraft({ ...draft, tags: on ? draft.tags.filter((x) => x !== t.id) : [...draft.tags, t.id] })
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={draft.release}
            onChange={(e) => setDraft({ ...draft, release: e.target.checked })}
          />
          <span>Had a release — cried, vented, let it out</span>
        </label>

        <label className="note">
          <span>Note</span>
          <textarea
            rows={3}
            placeholder="What's on your mind? Anything in your body?"
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          />
        </label>

        <div className="actions">
          {draft.id && (
            <button type="button" className="btn ghost" onClick={() => setDraft(blankDraft())}>
              Cancel
            </button>
          )}
          <button type="button" className="btn primary" onClick={() => save(draft)}>
            {draft.id ? 'Update' : 'Save check-in'}
            {draftLoad > 0 && <span className="badge">load {draftLoad}</span>}
          </button>
        </div>
      </section>

      {checkIns.length > 0 && summary && (
        <section className="card">
          <div className="card-head">
            <h2>{isToday ? "Today's" : 'This day’s'} check-ins</h2>
            <span className="muted-text">peak load {summary.load}</span>
          </div>
          <ul className="entries">
            {checkIns.map((c) => {
              const top = Object.entries(c.symptoms)
                .filter(([, v]) => v > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
              return (
                <li key={c.id} className={draft.id === c.id ? 'entry editing' : 'entry'}>
                  <button type="button" className="entry-main" onClick={() => edit(c)}>
                    <span className="entry-time">{toTimeString(c.at)}</span>
                    <span className="entry-body">
                      {top.length === 0 ? (
                        <span className="muted-text">All good</span>
                      ) : (
                        top.map(([id, v]) => (
                          <span key={id} className={`pill lvl-${v}`}>
                            {symptomLabel[id] ?? id} {v}
                          </span>
                        ))
                      )}
                      {c.release && <span className="pill release">release</span>}
                      {c.tags.map((t) => (
                        <span key={t} className="pill tag">
                          {tagLabel[t] ?? t}
                        </span>
                      ))}
                      {c.note && <span className="entry-note">{c.note}</span>}
                    </span>
                  </button>
                  <button type="button" className="icon-btn danger" aria-label="Delete" onClick={() => remove(c)}>
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className={toast ? 'toast show' : 'toast'} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
