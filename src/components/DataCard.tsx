import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Backup, MergePlan } from '../lib/backup';
import { exportBackup, exportCsv, importBackup, readBackupFile } from '../lib/dataIO';
import { relativeDays } from '../lib/relative';

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

export default function DataCard({ lastBackupAt }: { lastBackupAt?: number }) {
  const count = useLiveQuery(() => db.checkIns.count(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ backup: Backup; plan: MergePlan } | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
    } catch (e) {
      setMessage({ kind: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <h2>Your data</h2>
      <p className="muted-text">
        {plural(count ?? 0, 'check-in')}, stored only on this phone. Last backup: <strong>{relativeDays(lastBackupAt)}</strong>.
      </p>
      <p className="hint">
        If this phone is lost or the app's data is cleared, a backup file is the only way to get your check-ins back.
        Save one somewhere safe (Files, iCloud Drive, Google Drive) every week or so.
      </p>

      <button
        type="button"
        className="btn primary"
        disabled={busy}
        onClick={() =>
          run(async () => {
            if (await exportBackup()) setMessage({ kind: 'ok', text: 'Backup saved.' });
          })
        }
      >
        Back up now
      </button>

      <div className="btn-row">
        <button type="button" className="btn" disabled={busy} onClick={() => run(async () => void (await exportCsv()))}>
          Export spreadsheet (CSV)
        </button>
        <button type="button" className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>
          Restore from backup
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) run(async () => setPending(await readBackupFile(file)));
        }}
      />

      {pending && (
        <div className="confirm" role="dialog" aria-label="Confirm restore">
          <p>
            <strong>Restore this backup?</strong>
            {pending.backup.exportedAt && (
              <> Made {new Date(pending.backup.exportedAt).toLocaleDateString()}.</>
            )}
          </p>
          <ul>
            <li>{plural(pending.plan.newCheckIns, 'new check-in')}</li>
            {pending.plan.updatedCheckIns > 0 && (
              <li>{plural(pending.plan.updatedCheckIns, 'check-in')} you already have will be replaced by the backup's version</li>
            )}
            {pending.plan.sleepDays > 0 && <li>{plural(pending.plan.sleepDays, 'day')} of sleep</li>}
            {pending.plan.newSymptoms + pending.plan.newTags > 0 && (
              <li>
                {plural(pending.plan.newSymptoms, 'symptom')} and {plural(pending.plan.newTags, 'tag')} you don't have yet
              </li>
            )}
          </ul>
          <p className="hint">Nothing is deleted. Your reminder settings stay as they are.</p>
          <div className="btn-row">
            <button type="button" className="btn ghost" onClick={() => setPending(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() =>
                run(async () => {
                  await importBackup(pending.backup);
                  const n = pending.plan.newCheckIns + pending.plan.updatedCheckIns;
                  setPending(null);
                  setMessage({ kind: 'ok', text: `Restored ${plural(n, 'check-in')}.` });
                })
              }
            >
              Restore
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={message.kind === 'error' ? 'msg error' : 'msg ok'} role="status">
          {message.text}
        </p>
      )}
    </section>
  );
}
