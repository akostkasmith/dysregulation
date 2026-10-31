import type { CheckIn, Settings, Sleep, Symptom, Tag } from '../types';
import { fromDateAndTime, toTimeString } from './dates';

export const BACKUP_APP = 'dysregulation-tracker';
export const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  checkIns: CheckIn[];
  sleep: Sleep[];
  symptoms: Symptom[];
  tags: Tag[];
  settings?: Partial<Settings>;
}

export function buildBackup(data: Omit<Backup, 'app' | 'version' | 'exportedAt'>, now = new Date()): Backup {
  // Never put the AI API key in a backup file.
  const { apiKey: _drop, ...settings } = (data.settings ?? {}) as Settings;
  void _drop;
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), ...data, settings };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

/**
 * Hand-made or converted files may give a local `time` (HH:MM) instead of a
 * timestamp; resolve it in this device's time zone.
 */
function resolveAt(c: unknown): unknown {
  if (isObj(c) && typeof c.at !== 'number' && typeof c.date === 'string' && DATE.test(c.date)) {
    const time = typeof c.time === 'string' && TIME.test(c.time) ? c.time : '12:00';
    const { time: _t, ...rest } = c;
    void _t;
    return { ...rest, at: fromDateAndTime(c.date, time) };
  }
  return c;
}

function validCheckIn(c: unknown): c is CheckIn {
  return (
    isObj(c) &&
    typeof c.id === 'string' &&
    typeof c.at === 'number' &&
    typeof c.date === 'string' &&
    DATE.test(c.date) &&
    isObj(c.symptoms) &&
    Object.values(c.symptoms).every((v) => v === 0 || v === 1 || v === 2 || v === 3) &&
    Array.isArray(c.tags) &&
    typeof c.note === 'string'
  );
}
const validSleep = (s: unknown): s is Sleep => isObj(s) && typeof s.date === 'string' && DATE.test(s.date);
const validItem = (x: unknown): x is Symptom & Tag =>
  isObj(x) && typeof x.id === 'string' && typeof x.label === 'string';

/** Parse and validate a backup file. Throws a readable error if it isn't one. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file isn't a backup (it's not valid JSON).");
  }
  if (!isObj(raw) || raw.app !== BACKUP_APP) throw new Error("This file isn't a Dysregulation Tracker backup.");
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION)
    throw new Error('This backup was made by a newer version of the app. Reload the app and try again.');
  const arr = (k: string) => (Array.isArray(raw[k]) ? (raw[k] as unknown[]) : []);
  const checkIns = arr('checkIns').map(resolveAt);
  const bad = checkIns.filter((c) => !validCheckIn(c)).length;
  if (bad) throw new Error(`The backup has ${bad} damaged check-in${bad > 1 ? 's' : ''}, so nothing was imported.`);
  return {
    app: BACKUP_APP,
    version: raw.version,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    checkIns: (checkIns as CheckIn[]).map((c) => ({ ...c, release: !!c.release, updatedAt: c.updatedAt ?? c.at })),
    sleep: arr('sleep').filter(validSleep),
    symptoms: arr('symptoms').filter(validItem) as Symptom[],
    tags: arr('tags').filter(validItem) as Tag[],
    settings: isObj(raw.settings) ? (raw.settings as Partial<Settings>) : undefined,
  };
}

export interface MergePlan {
  newCheckIns: number;
  updatedCheckIns: number;
  sleepDays: number;
  newSymptoms: number;
  newTags: number;
}

/** What importing would change. Import merges: it adds and updates, never deletes. */
export function planMerge(
  backup: Backup,
  existing: { checkInIds: Set<string>; symptomIds: Set<string>; tagIds: Set<string> },
): MergePlan {
  const updated = backup.checkIns.filter((c) => existing.checkInIds.has(c.id)).length;
  return {
    newCheckIns: backup.checkIns.length - updated,
    updatedCheckIns: updated,
    sleepDays: backup.sleep.length,
    newSymptoms: backup.symptoms.filter((s) => !existing.symptomIds.has(s.id)).length,
    newTags: backup.tags.filter((t) => !existing.tagIds.has(t.id)).length,
  };
}

const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per check-in, for spreadsheets or sharing with a therapist. */
export function toCsv(checkIns: CheckIn[], sleep: Sleep[], symptoms: Symptom[], tags: Tag[]): string {
  const sleepBy = new Map(sleep.map((s) => [s.date, s]));
  const tagLabel = new Map(tags.map((t) => [t.id, t.label]));
  const syms = [...symptoms].sort((a, b) => a.order - b.order);
  const header = [
    'date',
    'time',
    ...syms.map((s) => s.label),
    'tags',
    'release',
    'note',
    'sleep_quality_1to5',
    'wake_time',
    'night_wakings',
  ];
  const rows = [...checkIns]
    .sort((a, b) => a.at - b.at)
    .map((c) => {
      const s = sleepBy.get(c.date);
      return [
        c.date,
        toTimeString(c.at),
        ...syms.map((x) => c.symptoms[x.id] ?? ''),
        c.tags.map((t) => tagLabel.get(t) ?? t).join('; '),
        c.release ? 'yes' : '',
        c.note,
        s?.quality ?? '',
        s?.wakeTime ?? '',
        s?.nightWakings ?? '',
      ];
    });
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
