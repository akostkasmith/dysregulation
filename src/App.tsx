import { useState, type ReactNode } from 'react';
import Today from './screens/Today';
import History from './screens/History';
import Placeholder from './screens/Placeholder';
import { toDateKey } from './lib/dates';

type Tab = 'today' | 'history' | 'insights' | 'settings';

const svg = (d: string) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'today', label: 'Check-in', icon: svg('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6') },
  { id: 'history', label: 'History', icon: svg('M4 5h16v15H4zM4 10h16M9 3v4M15 3v4') },
  { id: 'insights', label: 'Insights', icon: svg('M4 20V10M10 20V4M16 20v-7M22 20H2') },
  { id: 'settings', label: 'Settings', icon: svg('M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4') },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [date, setDate] = useState(() => toDateKey(new Date()));

  return (
    <div className="app">
      <main className="screen">
        {tab === 'today' && <Today date={date} onDateChange={setDate} />}
        {tab === 'history' && (
          <History
            onOpenDay={(d) => {
              setDate(d);
              setTab('today');
            }}
          />
        )}
        {tab === 'insights' && (
          <Placeholder title="Insights">
            Trends, your top symptoms, and links between sleep, triggers and how you feel arrive in a later
            milestone. Keep checking in — patterns need about 3–4 weeks of data.
          </Placeholder>
        )}
        {tab === 'settings' && (
          <Placeholder title="Settings">
            Editing symptoms and tags, reminders (3× a day), export/import and the spreadsheet import are coming in
            the next milestones. Your data is stored only on this device.
          </Placeholder>
        )}
      </main>
      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'tab active' : 'tab'}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
