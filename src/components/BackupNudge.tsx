import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { exportBackup } from '../lib/dataIO';
import { daysAgo, relativeDays } from '../lib/relative';

const NUDGE_AFTER_DAYS = 7;
const MIN_CHECKINS = 5;

/** A gentle prompt on the check-in screen when there's data worth protecting and no recent backup. */
export default function BackupNudge({ lastBackupAt }: { lastBackupAt?: number }) {
  const count = useLiveQuery(() => db.checkIns.count(), []);
  const [hidden, setHidden] = useState(false);
  if (hidden || count === undefined || count < MIN_CHECKINS) return null;
  if (lastBackupAt && daysAgo(lastBackupAt) < NUDGE_AFTER_DAYS) return null;

  return (
    <section className="card nudge">
      <span>
        Last backup: <strong>{relativeDays(lastBackupAt)}</strong>. Save a copy of your check-ins somewhere safe.
      </span>
      <div className="btn-row">
        <button type="button" className="btn ghost" onClick={() => setHidden(true)}>
          Later
        </button>
        <button type="button" className="btn primary" onClick={() => exportBackup()}>
          Back up
        </button>
      </div>
    </section>
  );
}
