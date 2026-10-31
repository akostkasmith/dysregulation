const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(d: Date | number): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function toTimeString(d: Date | number): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

/** Combine a YYYY-MM-DD key and HH:MM into a local timestamp. */
export function fromDateAndTime(date: string, time: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime();
}

export function minutesOfDay(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function formatDayLabel(date: string, today = toDateKey(new Date())): string {
  if (date === today) return 'Today';
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  if (date === toDateKey(yest)) return 'Yesterday';
  const sameYear = y === new Date().getFullYear();
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
