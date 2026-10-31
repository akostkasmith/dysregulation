import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import ReminderCard from '../components/ReminderCard';
import InstallCard from '../components/InstallCard';
import DataCard from '../components/DataCard';

export default function Settings() {
  const settings = useLiveQuery(() => db.settings.get('settings'), []);
  if (!settings) return null;
  return (
    <>
      <header className="screen-header">
        <h1>Settings</h1>
      </header>
      <ReminderCard settings={settings} />
      <DataCard lastBackupAt={settings.lastBackupAt} />
      <InstallCard />
      <section className="card muted-text">
        Coming next: editing symptoms and tags. Your data is stored only on this device.
      </section>
    </>
  );
}
