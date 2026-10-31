export function daysAgo(ts: number, now = Date.now()): number {
  return Math.floor((now - ts) / 86_400_000);
}

export function relativeDays(ts: number | undefined, now = Date.now()): string {
  if (!ts) return 'never';
  const d = daysAgo(ts, now);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d} days ago`;
}
