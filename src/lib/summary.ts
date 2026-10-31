import type { CheckIn, Intensity } from '../types';
import { minutesOfDay } from './dates';

export interface DaySummary {
  date: string;
  count: number;
  /** Peak intensity per symptom across the day's check-ins. */
  peaks: Record<string, Intensity>;
  /** Sum of peaks: a single "how heavy was today" number. */
  load: number;
  tags: string[];
  release: boolean;
}

export function summarizeDay(date: string, checkIns: CheckIn[]): DaySummary {
  const peaks: Record<string, Intensity> = {};
  const tags = new Set<string>();
  let release = false;
  for (const c of checkIns) {
    for (const [id, v] of Object.entries(c.symptoms)) {
      peaks[id] = Math.max(peaks[id] ?? 0, v) as Intensity;
    }
    c.tags.forEach((t) => tags.add(t));
    release ||= c.release;
  }
  const load = Object.values(peaks).reduce<number>((a, b) => a + b, 0);
  return { date, count: checkIns.length, peaks, load, tags: [...tags], release };
}

/**
 * Which reminder slots have a check-in. A check-in belongs to the latest
 * slot whose time is at or before it; anything before the first slot
 * counts toward the first slot.
 */
export function slotsCovered(reminderTimes: string[], checkIns: CheckIn[]): boolean[] {
  const slots = reminderTimes.map(minutesOfDay);
  const covered = slots.map(() => false);
  for (const c of checkIns) {
    const d = new Date(c.at);
    const m = d.getHours() * 60 + d.getMinutes();
    let idx = 0;
    slots.forEach((s, i) => {
      if (m >= s) idx = i;
    });
    covered[idx] = true;
  }
  return covered;
}
