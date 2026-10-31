import { describe, expect, it } from 'vitest';
import { buildBackup, parseBackup, planMerge, toCsv } from './backup';
import { defaultSymptoms, defaultTags } from '../defaults';
import type { CheckIn } from '../types';

const ci: CheckIn = {
  id: 'a',
  at: new Date(2026, 10, 1, 8, 5).getTime(),
  date: '2026-11-01',
  symptoms: { anxiety: 2, bloated: 1 },
  tags: ['work'],
  release: true,
  note: 'Big day, "nervous", but ok',
  updatedAt: 1,
};
const data = {
  checkIns: [ci],
  sleep: [{ date: '2026-11-01', quality: 2 as const, wakeTime: '05:45', nightWakings: 2 }],
  symptoms: defaultSymptoms,
  tags: defaultTags,
  settings: { id: 'settings' as const, reminderTimes: ['08:00'], apiKey: 'sk-secret' },
};

describe('backup round trip', () => {
  it('survives JSON and drops the API key', () => {
    const json = JSON.stringify(buildBackup(data));
    expect(json).not.toContain('sk-secret');
    const back = parseBackup(json);
    expect(back.checkIns).toEqual([ci]);
    expect(back.sleep).toHaveLength(1);
    expect(back.symptoms).toHaveLength(defaultSymptoms.length);
  });

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('nope')).toThrow(/not valid JSON/);
    expect(() => parseBackup('{"app":"other"}')).toThrow(/isn't a Dysregulation Tracker backup/);
    expect(() => parseBackup(JSON.stringify({ ...buildBackup(data), version: 99 }))).toThrow(/newer version/);
  });

  it('rejects damaged check-ins instead of importing half', () => {
    const b = buildBackup(data);
    const broken = { ...b, checkIns: [ci, { ...ci, id: 'b', symptoms: { anxiety: 7 } }] };
    expect(() => parseBackup(JSON.stringify(broken))).toThrow(/1 damaged check-in/);
  });

  it('fills defaults for older optional fields', () => {
    const { release: _r, updatedAt: _u, ...old } = ci;
    void _r; void _u;
    const b = parseBackup(JSON.stringify({ ...buildBackup(data), checkIns: [old] }));
    expect(b.checkIns[0]).toMatchObject({ release: false, updatedAt: ci.at });
  });
});

describe('local time entries', () => {
  it('resolves date + time into a local timestamp', () => {
    const { at: _a, ...noAt } = ci;
    void _a;
    const b = parseBackup(JSON.stringify({ ...buildBackup(data), checkIns: [{ ...noAt, time: '12:00' }] }));
    expect(b.checkIns[0].at).toBe(new Date(2026, 10, 1, 12, 0).getTime());
    expect('time' in b.checkIns[0]).toBe(false);
  });
});

describe('planMerge', () => {
  it('counts new vs updated items', () => {
    const b = buildBackup({ ...data, checkIns: [ci, { ...ci, id: 'b' }] });
    const plan = planMerge(b, {
      checkInIds: new Set(['a']),
      symptomIds: new Set(defaultSymptoms.map((s) => s.id).slice(1)),
      tagIds: new Set(defaultTags.map((t) => t.id)),
    });
    expect(plan).toEqual({ newCheckIns: 1, updatedCheckIns: 1, sleepDays: 1, newSymptoms: 1, newTags: 0 });
  });
});

describe('toCsv', () => {
  it('writes one row per check-in with labels, sleep and escaped notes', () => {
    const csv = toCsv(data.checkIns, data.sleep, data.symptoms, data.tags);
    const [header, row] = csv.trim().split('\r\n');
    expect(header.startsWith('date,time,Anxiety,')).toBe(true);
    expect(row.startsWith('2026-11-01,08:05,2,')).toBe(true);
    expect(row).toContain('Work,yes,"Big day, ""nervous"", but ok",2,05:45,2');
  });
});
