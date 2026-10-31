import { db } from '../db';
import { buildBackup, parseBackup, planMerge, toCsv, type Backup, type MergePlan } from './backup';
import { toDateKey } from './dates';

const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

/**
 * Hand a file to the user. On phones, use the share sheet (Save to Files,
 * iCloud, Drive, email...), which works inside installed apps where plain
 * downloads often don't. Returns false if the user cancelled.
 */
export async function saveFile(name: string, text: string, type: string): Promise<boolean> {
  const file = new File([text], name, { type });
  if (isTouch() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return true;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return false;
      // Fall through to a download if sharing failed for another reason.
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  return true;
}

export async function exportBackup(): Promise<boolean> {
  const [checkIns, sleep, symptoms, tags, settings] = await Promise.all([
    db.checkIns.toArray(),
    db.sleep.toArray(),
    db.symptoms.toArray(),
    db.tags.toArray(),
    db.settings.get('settings'),
  ]);
  const backup = buildBackup({ checkIns, sleep, symptoms, tags, settings });
  const ok = await saveFile(
    `check-in-backup-${toDateKey(new Date())}.json`,
    JSON.stringify(backup, null, 1),
    'application/json',
  );
  if (ok) await db.settings.update('settings', { lastBackupAt: Date.now() });
  return ok;
}

export async function exportCsv(): Promise<boolean> {
  const [checkIns, sleep, symptoms, tags] = await Promise.all([
    db.checkIns.toArray(),
    db.sleep.toArray(),
    db.symptoms.toArray(),
    db.tags.toArray(),
  ]);
  return saveFile(`check-ins-${toDateKey(new Date())}.csv`, toCsv(checkIns, sleep, symptoms, tags), 'text/csv');
}

export async function readBackupFile(file: File): Promise<{ backup: Backup; plan: MergePlan }> {
  const backup = parseBackup(await file.text());
  const [checkInIds, symptomIds, tagIds] = await Promise.all([
    db.checkIns.toCollection().primaryKeys(),
    db.symptoms.toCollection().primaryKeys(),
    db.tags.toCollection().primaryKeys(),
  ]);
  const plan = planMerge(backup, {
    checkInIds: new Set(checkInIds),
    symptomIds: new Set(symptomIds),
    tagIds: new Set(tagIds),
  });
  return { backup, plan };
}

/** Merge a backup in: adds and updates, never deletes. Your current settings are kept. */
export async function importBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', [db.checkIns, db.sleep, db.symptoms, db.tags], async () => {
    await db.checkIns.bulkPut(backup.checkIns);
    await db.sleep.bulkPut(backup.sleep);
    for (const table of [db.symptoms, db.tags] as const) {
      const items = backup[table === db.symptoms ? 'symptoms' : 'tags'];
      const existing = await table.toArray();
      const have = new Set(existing.map((x) => x.id));
      let order = Math.max(-1, ...existing.map((x) => x.order)) + 1;
      const add = items.filter((x) => !have.has(x.id)).map((x) => ({ ...x, hidden: !!x.hidden, order: order++ }));
      if (add.length) await table.bulkAdd(add);
    }
  });
}
