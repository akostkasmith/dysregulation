import { useState } from 'react';
import { db } from '../db';
import type { Sleep } from '../types';

const QUALITY = ['Awful', 'Poor', 'OK', 'Good', 'Great'];

export default function SleepCard({ date, sleep }: { date: string; sleep: Sleep | null }) {
  // Start collapsed only if sleep was already logged when the day was opened,
  // so rating it doesn't hide the other fields mid-entry.
  const [editing, setEditing] = useState(!sleep?.quality);
  const save = (patch: Partial<Sleep>) => db.sleep.put({ ...sleep, ...patch, date });

  if (sleep?.quality && !editing) {
    return (
      <section className="card compact">
        <span>
          <strong>Sleep:</strong> {QUALITY[sleep.quality - 1]}
          {sleep.wakeTime && ` · woke ${sleep.wakeTime}`}
          {!!sleep.nightWakings && ` · up ${sleep.nightWakings}× in the night`}
        </span>
        <button type="button" className="link-btn" onClick={() => setEditing(true)}>
          Edit
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Last night's sleep</h2>
      <div className="seg" role="radiogroup" aria-label="Sleep quality">
        {QUALITY.map((q, i) => {
          const val = (i + 1) as NonNullable<Sleep['quality']>;
          const on = sleep?.quality === val;
          return (
            <button
              key={q}
              type="button"
              role="radio"
              aria-checked={on}
              className={on ? 'seg-btn on' : 'seg-btn'}
              onClick={() => save({ quality: val })}
            >
              {q}
            </button>
          );
        })}
      </div>
      <div className="row-fields">
        <label>
          Woke up at
          <input
            type="time"
            value={sleep?.wakeTime ?? ''}
            onChange={(e) => save({ wakeTime: e.target.value || undefined })}
          />
        </label>
        <div className="field">
          <span>Up in the night</span>
          <div className="stepper">
            <button
              type="button"
              aria-label="Fewer"
              onClick={() => save({ nightWakings: Math.max(0, (sleep?.nightWakings ?? 0) - 1) })}
            >
              −
            </button>
            <output>{sleep?.nightWakings ?? 0}×</output>
            <button
              type="button"
              aria-label="More"
              onClick={() => save({ nightWakings: (sleep?.nightWakings ?? 0) + 1 })}
            >
              +
            </button>
          </div>
        </div>
      </div>
      {!sleep?.quality ? (
        <p className="hint">Tap a rating to log sleep for this day.</p>
      ) : (
        <button type="button" className="link-btn" onClick={() => setEditing(false)}>
          Done with sleep
        </button>
      )}
    </section>
  );
}
