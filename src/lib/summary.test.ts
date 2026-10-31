import { describe, expect, it } from 'vitest';
import { slotsCovered, summarizeDay } from './summary';
import type { CheckIn } from '../types';

const at = (h: number, m = 0) => new Date(2026, 9, 31, h, m).getTime();
const ci = (h: number, symptoms: CheckIn['symptoms'], extra: Partial<CheckIn> = {}): CheckIn => ({
  id: String(h),
  at: at(h),
  date: '2026-10-31',
  symptoms,
  tags: [],
  release: false,
  note: '',
  updatedAt: 0,
  ...extra,
});

describe('summarizeDay', () => {
  it('takes the peak of each symptom and sums them into a load', () => {
    const s = summarizeDay('2026-10-31', [
      ci(8, { anxiety: 1, bloated: 3 }),
      ci(13, { anxiety: 3, bloated: 0 }, { tags: ['work'] }),
      ci(20, { anxiety: 0, bloated: 1 }, { tags: ['work', 'kids'], release: true }),
    ]);
    expect(s.peaks).toEqual({ anxiety: 3, bloated: 3 });
    expect(s.load).toBe(6);
    expect(s.count).toBe(3);
    expect(s.tags.sort()).toEqual(['kids', 'work']);
    expect(s.release).toBe(true);
  });

  it('handles an empty day', () => {
    expect(summarizeDay('2026-10-31', [])).toMatchObject({ load: 0, count: 0, release: false });
  });
});

describe('slotsCovered', () => {
  const times = ['08:00', '13:00', '20:00'];
  it('assigns check-ins to the latest slot at or before them', () => {
    expect(slotsCovered(times, [ci(9, {}), ci(21, {})])).toEqual([true, false, true]);
  });
  it('counts early-morning check-ins toward the first slot', () => {
    expect(slotsCovered(times, [ci(6, {})])).toEqual([true, false, false]);
  });
  it('counts check-ins between midday and evening as midday', () => {
    expect(slotsCovered(times, [ci(19, {})])).toEqual([false, true, false]);
  });
});
