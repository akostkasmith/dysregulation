import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import ReminderCard from '../components/ReminderCard';
import InstallCard from '../components/InstallCard';

export default function Settings() {
  const settings = useLiveQuery(() => db.settings.get('settings'), []);
  if (!settings) return null;
  return (
    <>
      <header className="screen-header">
        <h1>Settings</h1>
      </header>
      <ReminderCard settings={settings} />
      <InstallCard />
      <section className="card muted-text">
        Coming next: editing symptoms and tags, export/import, and importing your old spreadsheet. Your data is
        stored only on this device.
      </section>
    </>
  );
}
