import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { CheckIn } from '../types';
import { formatDayLabel } from '../lib/dates';
import { summarizeDay } from '../lib/summary';

const QUALITY = ['Awful', 'Poor', 'OK', 'Good', 'Great'];

export default function History({ onOpenDay }: { onOpenDay: (date: string) => void }) {
  const checkIns = useLiveQuery(() => db.checkIns.orderBy('at').reverse().toArray(), []);
  const sleep = useLiveQuery(() => db.sleep.toArray(), []);
  const symptomCount = useLiveQuery(() => db.symptoms.filter((s) => !s.hidden).count(), []);

  const days = useMemo(() => {
    if (!checkIns) return [];
    const byDate = new Map<string, CheckIn[]>();
    for (const c of checkIns) byDate.set(c.date, [...(byDate.get(c.date) ?? []), c]);
    return [...byDate.entries()].map(([date, list]) => summarizeDay(date, list));
  }, [checkIns]);
  const sleepBy = useMemo(() => new Map((sleep ?? []).map((s) => [s.date, s])), [sleep]);

  if (!checkIns) return null;
  const maxLoad = Math.max(1, (symptomCount ?? 11) * 3);

  return (
    <>
      <header className="screen-header">
        <h1>History</h1>
        <p className="muted-text">The calendar heatmap is coming next. For now: every day you've logged.</p>
      </header>
      {days.length === 0 ? (
        <section className="card muted-text">No check-ins yet.</section>
      ) : (
        <ul className="card days">
          {days.map((d) => {
            const s = sleepBy.get(d.date);
            return (
              <li key={d.date}>
                <button type="button" className="day-row" onClick={() => onOpenDay(d.date)}>
                  <span className="day-name">{formatDayLabel(d.date)}</span>
                  <span className="load-bar" aria-label={`Load ${d.load}`}>
                    <span style={{ width: `${(d.load / maxLoad) * 100}%` }} />
                  </span>
                  <span className="day-meta">
                    {Object.keys(d.peaks).length ? `load ${d.load}` : 'note only'} · {d.count}×{s?.quality ? ` · sleep ${QUALITY[s.quality - 1].toLowerCase()}` : ''}
                    {d.release ? ' · release' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
