import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function InstallCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <section className="card">
        <h2>Installed</h2>
        <p className="muted-text">You're using the home-screen app. It works offline.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Add to your home screen</h2>
      {deferred ? (
        <>
          <p className="muted-text">Install it as an app so it opens full-screen and works offline.</p>
          <button
            type="button"
            className="btn primary"
            onClick={async () => {
              await deferred.prompt();
              await deferred.userChoice;
              setDeferred(null);
            }}
          >
            Install app
          </button>
        </>
      ) : isIOS() ? (
        <ol className="steps">
          <li>
            Open this page in <strong>Safari</strong>.
          </li>
          <li>
            Tap the <strong>Share</strong> button.
          </li>
          <li>
            Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
          </li>
        </ol>
      ) : (
        <p className="muted-text">
          In your browser's menu, choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
        </p>
      )}
      <p className="hint">
        Your check-ins are tied to this exact web address and browser. Use the installed app from now on so
        everything stays in one place.
      </p>
    </section>
  );
}
