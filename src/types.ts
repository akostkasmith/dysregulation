export type Intensity = 0 | 1 | 2 | 3;

export interface Symptom {
  id: string;
  label: string;
  order: number;
  hidden: boolean;
}

export interface Tag {
  id: string;
  label: string;
  order: number;
  hidden: boolean;
}

export interface CheckIn {
  id: string;
  /** Timestamp (ms) of the moment being described. */
  at: number;
  /** Local date YYYY-MM-DD derived from `at`. */
  date: string;
  symptoms: Record<string, Intensity>;
  tags: string[];
  release: boolean;
  note: string;
  updatedAt: number;
}

export interface Sleep {
  date: string;
  quality?: 1 | 2 | 3 | 4 | 5;
  wakeTime?: string;
  nightWakings?: number;
}

export interface Settings {
  id: 'settings';
  reminderTimes: string[];
  /** Show a notification at reminder times while the app is open or in the background. */
  notify?: boolean;
  /** When the user last saved a backup file. */
  lastBackupAt?: number;
  apiKey?: string;
}
