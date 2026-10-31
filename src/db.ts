import Dexie, { type EntityTable } from 'dexie';
import type { CheckIn, Settings, Sleep, Symptom, Tag } from './types';
import { defaultSettings, defaultSymptoms, defaultTags } from './defaults';

export const db = new Dexie('dysregulation') as Dexie & {
  checkIns: EntityTable<CheckIn, 'id'>;
  sleep: EntityTable<Sleep, 'date'>;
  symptoms: EntityTable<Symptom, 'id'>;
  tags: EntityTable<Tag, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

db.version(1).stores({
  checkIns: 'id, date, at',
  sleep: 'date',
  symptoms: 'id, order',
  tags: 'id, order',
  settings: 'id',
});

db.on('populate', async (tx) => {
  await tx.table('symptoms').bulkAdd(defaultSymptoms);
  await tx.table('tags').bulkAdd(defaultTags);
  await tx.table('settings').add(defaultSettings);
});

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* not supported */
  }
}

export function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
