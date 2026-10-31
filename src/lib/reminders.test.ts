import { describe, expect, it } from 'vitest';
import { buildIcs, dueSlot, googleCalendarUrl } from './reminders';

const now = new Date(2026, 10, 1, 7, 30);
const url = 'https://example.github.io/dysregulation/';

describe('buildIcs', () => {
  const ics = buildIcs(['08:00', '13:00', '20:00'], url, now);
  it('creates one daily event per reminder with an alarm at the start', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics.match(/RRULE:FREQ=DAILY/g)).toHaveLength(3);
    expect(ics.match(/TRIGGER:PT0M/g)).toHaveLength(3);
    expect(ics).toContain('DTSTART:20261101T080000');
    expect(ics).toContain('DTEND:20261101T130500');
    expect(ics).toContain('SUMMARY:Evening check-in');
  });
  it('uses CRLF line endings and folds long lines', () => {
    expect(ics.includes('\r\n')).toBe(true);
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });
  it('uses stable UIDs per slot', () => {
    expect(ics).toContain('UID:checkin-slot-0@dysregulation-tracker');
    expect(buildIcs(['09:00'], url, new Date(2027, 0, 1))).toContain('UID:checkin-slot-0@dysregulation-tracker');
  });
});

describe('googleCalendarUrl', () => {
  it('builds a daily repeating event link', () => {
    const u = new URL(googleCalendarUrl('13:00', 1, url, now, 'Europe/Oslo'));
    expect(u.searchParams.get('text')).toBe('Midday check-in');
    expect(u.searchParams.get('dates')).toBe('20261101T130000/20261101T130500');
    expect(u.searchParams.get('recur')).toBe('RRULE:FREQ=DAILY');
    expect(u.searchParams.get('ctz')).toBe('Europe/Oslo');
  });
});

describe('dueSlot', () => {
  const times = ['08:00', '13:00', '20:00'];
  const at = (h: number, m = 0) => new Date(2026, 10, 1, h, m);
  it('finds the slot within its window', () => {
    expect(dueSlot(times, at(8, 5))).toBe(0);
    expect(dueSlot(times, at(14, 29))).toBe(1);
    expect(dueSlot(times, at(20, 0))).toBe(2);
  });
  it('returns -1 outside any window', () => {
    expect(dueSlot(times, at(7, 59))).toBe(-1);
    expect(dueSlot(times, at(10, 0))).toBe(-1);
  });
});
