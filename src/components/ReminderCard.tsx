import { useEffect, useState } from 'react';
import { db } from '../db';
import type { Settings } from '../types';
import { appUrl, buildIcs, googleCalendarUrl, slotName } from '../lib/reminders';

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function ReminderCard({ settings }: { settings: Settings }) {
  const [times, setTimes] = useState(settings.reminderTimes);
  const [permission, setPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  const [notify, setNotify] = useState(!!settings.notify);
  useEffect(() => setTimes(settings.reminderTimes), [settings.reminderTimes]);
  useEffect(() => setNotify(!!settings.notify), [settings.notify]);

  const saveTimes = (next: string[]) => {
    const sorted = [...next].sort();
    setTimes(sorted);
    db.settings.update('settings', { reminderTimes: sorted });
  };

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(times, appUrl())], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'check-in-reminders.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };

  const toggleNotify = async (on: boolean) => {
    setNotify(on);
    if (on && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      setPermission(await Notification.requestPermission());
    }
    await db.settings.update('settings', { notify: on });
  };

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <section className="card">
      <h2>Reminders</h2>
      <p className="muted-text">Three nudges a day to check in.</p>

      <div className="reminder-times">
        {times.map((t, i) => (
          <label key={i}>
            {slotName(i)}
            <input
              type="time"
              value={t}
              onChange={(e) => {
                if (!e.target.value) return;
                const next = [...times];
                next[i] = e.target.value;
                setTimes(next);
              }}
              onBlur={() => saveTimes(times)}
            />
          </label>
        ))}
      </div>

      <h3>Add to your calendar</h3>
      <p className="hint">
        Your phone's calendar is the reliable way to get reminded, even when the app is closed. Each event repeats
        daily and links back here. If you change the times, add them again.
      </p>
      <button type="button" className="btn primary" onClick={downloadIcs}>
        {isIOS() ? 'Add to iPhone Calendar' : 'Download calendar file (.ics)'}
      </button>
      {isIOS() && standalone && (
        <p className="hint">If nothing happens, open this page in Safari and tap the button there.</p>
      )}
      <div className="gcal">
        <span className="hint">Google Calendar, one at a time:</span>
        <div className="chips">
          {times.map((t, i) => (
            <a key={i} className="chip" href={googleCalendarUrl(t, i, appUrl(), new Date(), tz)} target="_blank" rel="noreferrer">
              + {slotName(i)} {t}
            </a>
          ))}
        </div>
        <span className="hint">Set each event's notification to "At time of event".</span>
      </div>

      <h3>In-app notifications</h3>
      {permission === 'unsupported' ? (
        <p className="hint">
          {isIOS() ? 'Install the app to your home screen first to allow notifications.' : 'Not supported in this browser.'}
        </p>
      ) : (
        <>
          <label className="toggle">
            <input type="checkbox" checked={notify} onChange={(e) => toggleNotify(e.target.checked)} />
            <span>Notify me when a check-in is due</span>
          </label>
          <p className="hint">
            Only works while the app is open or recently used, so keep the calendar reminders too. Skipped if
            you've already checked in for that part of the day.
            {permission === 'denied' && ' Notifications are blocked: allow them in your phone settings for this app.'}
          </p>
        </>
      )}
    </section>
  );
}
