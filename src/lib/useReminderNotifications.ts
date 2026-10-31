import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { toDateKey } from './dates';
import { dueSlot, slotName } from './reminders';
import { slotsCovered } from './summary';

const sentKey = (date: string, i: number) => `reminder-sent:${date}:${i}`;

function alreadySent(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
function markSent(key: string) {
  try {
    localStorage.setItem(key, '1');
  } catch {
    /* storage unavailable */
  }
}

/**
 * While the app is open (or kept alive in the background), show a
 * notification when a reminder slot comes due and it has no check-in yet.
 * The calendar events are the reliable reminder; this is a bonus.
 */
export function useReminderNotifications() {
  const settings = useLiveQuery(() => db.settings.get('settings'), []);

  useEffect(() => {
    if (!settings?.notify || typeof Notification === 'undefined') return;

    const check = async () => {
      if (Notification.permission !== 'granted') return;
      const now = new Date();
      const i = dueSlot(settings.reminderTimes, now);
      if (i < 0) return;
      const date = toDateKey(now);
      const key = sentKey(date, i);
      if (alreadySent(key)) return;
      const todays = await db.checkIns.where('date').equals(date).toArray();
      if (slotsCovered(settings.reminderTimes, todays)[i]) return;
      markSent(key);
      const reg = await navigator.serviceWorker?.getRegistration();
      const title = `${slotName(i)} check-in`;
      const options = { body: 'How are you right now?', icon: 'pwa-192.png', badge: 'pwa-192.png', tag: key };
      if (reg) await reg.showNotification(title, options);
      else new Notification(title, options);
    };

    check();
    const id = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [settings]);
}
