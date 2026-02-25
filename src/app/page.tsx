'use client';

import { useEffect } from 'react';
import { DEFAULT_LOCALE } from '@/lib/locales';

export default function RootPage() {
  const target = `/${DEFAULT_LOCALE}`;

  useEffect(() => {
    if (window.location.pathname !== target) {
      window.location.replace(target);
    }
  }, [target]);

  return (
    <main className="min-h-screen flex items-center justify-center text-[var(--foreground)]">
      <div className="text-center space-y-3">
        <div className="text-sm text-[var(--muted-foreground)]">Redirecting…</div>
        <a className="text-sm text-indigo-500 hover:text-indigo-400 underline" href={target}>
          Continue to {target}
        </a>
      </div>
    </main>
  );
}
