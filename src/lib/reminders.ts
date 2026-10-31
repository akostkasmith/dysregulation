import { minutesOfDay } from './dates';

export const SLOT_NAMES = ['Morning', 'Midday', 'Evening'];

export const slotName = (i: number) => SLOT_NAMES[i] ?? `Check-in ${i + 1}`;

const pad = (n: number) => String(n).padStart(2, '0');

/** YYYYMMDDTHHMMSS in local "floating" time (no zone), as calendars expect for wall-clock reminders. */
function floating(date: Date, time: string, addMinutes = 0): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m + addMinutes);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Escape TEXT values per RFC 5545. */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Fold lines longer than 75 octets (approximated by chars) per RFC 5545. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    out.push(rest.slice(0, 75));
    rest = ' ' + rest.slice(75);
  }
  out.push(rest);
  return out.join('\r\n');
}

/**
 * A calendar file with one daily repeating event per reminder time, each
 * alerting at the start. UIDs are stable per slot, so re-importing after
 * changing times updates the events instead of duplicating them (in
 * calendars that honour UIDs, e.g. Apple Calendar).
 */
export function buildIcs(times: string[], appUrl: string, now = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dysregulation Tracker//Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  times.forEach((t, i) => {
    const title = `${slotName(i)} check-in`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:checkin-slot-${i}@dysregulation-tracker`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART:${floating(now, t)}`,
      `DTEND:${floating(now, t, 5)}`,
      'RRULE:FREQ=DAILY',
      `SUMMARY:${esc(title)}`,
      `DESCRIPTION:${esc(`How are you right now? Open the app: ${appUrl}`)}`,
      `URL:${appUrl}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(title)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** "Add to Google Calendar" link for one daily repeating reminder. */
export function googleCalendarUrl(time: string, index: number, appUrl: string, now = new Date(), tz?: string): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${slotName(index)} check-in`,
    dates: `${floating(now, time)}/${floating(now, time, 5)}`,
    recur: 'RRULE:FREQ=DAILY',
    details: `How are you right now? Open the app: ${appUrl}`,
  });
  if (tz) params.set('ctz', tz);
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Index of a slot that is due now (within `windowMin` after its time), or -1. */
export function dueSlot(times: string[], now: Date, windowMin = 90): number {
  const m = now.getHours() * 60 + now.getMinutes();
  for (let i = times.length - 1; i >= 0; i--) {
    const s = minutesOfDay(times[i]);
    if (m >= s && m < s + windowMin) return i;
  }
  return -1;
}

/** The app's own URL without index.html, for linking back from calendars. */
export function appUrl(): string {
  return location.origin + location.pathname.replace(/index\.html$/, '');
}
