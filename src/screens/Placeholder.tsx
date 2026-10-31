import type { ReactNode } from 'react';

export default function Placeholder({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="screen-header">
        <h1>{title}</h1>
      </header>
      <section className="card muted-text">{children}</section>
    </>
  );
}
