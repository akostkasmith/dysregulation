import type { Settings, Symptom, Tag } from './types';

// Merged from the original 13 spreadsheet columns:
//   Threatened + Lack of safety -> Unsafe / threatened
//   Brain fog + Bad memory      -> Brain fog / forgetful
const SYMPTOMS: [string, string][] = [
  ['anxiety', 'Anxiety'],
  ['cant-relax', "Can't relax"],
  ['irritable', 'Highly irritable'],
  ['unsafe', 'Unsafe / threatened'],
  ['disconnected', 'Disconnected from emotions'],
  ['brain-fog', 'Brain fog / forgetful'],
  ['tiredness', 'Unexplained tiredness'],
  ['body-focus', 'Focused on body issues'],
  ['bladder', 'Overactive bladder'],
  ['bloated', 'Bloated'],
  ['eyes', 'Eye irritation'],
];

const TAGS: [string, string][] = [
  ['work', 'Work'],
  ['family', 'Family'],
  ['kids', 'Kids'],
  ['partner', 'Partner'],
  ['health', 'Health / illness'],
  ['sleep', 'Sleep'],
  ['conflict', 'Conflict'],
  ['rejection', 'Rejection'],
  ['social', 'Social'],
  ['money', 'Money'],
];

export const defaultSymptoms: Symptom[] = SYMPTOMS.map(([id, label], order) => ({
  id,
  label,
  order,
  hidden: false,
}));

export const defaultTags: Tag[] = TAGS.map(([id, label], order) => ({
  id,
  label,
  order,
  hidden: false,
}));

export const defaultSettings: Settings = {
  id: 'settings',
  reminderTimes: ['08:00', '13:00', '20:00'],
};
