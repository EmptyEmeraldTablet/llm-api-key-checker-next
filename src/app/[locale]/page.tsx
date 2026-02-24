'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslations } from 'next-intl';
import { PROVIDERS, ProviderId, getProviderMeta } from '@/lib/providers';
import { parseKeys, CheckResult } from '@/lib/checkers';
import { LOCALES } from '@/lib/locales';

const siteUrl = 'https://check.chat-tempmail.com';

type Row = CheckResult;

type ModelFetchInfo = { kind: 'success' | 'error'; text: string };

function formatRaw(raw: unknown) {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

function ThemeSwitcher() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle('dark', stored === 'dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <button
      onClick={toggle}
      className="rounded-full bg-[var(--card-bg)] p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--glass-border)] transition-colors"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      ) : (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      )}
    </button>
  );
}

function LocaleSwitcher() {
  const [pathname, setPathname] = useState<string>('/en');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const locale = e.target.value;
    if (typeof window === 'undefined') return;
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) {
      window.location.pathname = `/${locale}`;
      return;
    }
    const first = parts[0];
    const knownLocales = LOCALES.map((l) => l.code) as string[];
    if (knownLocales.includes(first)) {
      parts[0] = locale;
      window.location.pathname = '/' + parts.join('/');
    } else {
      window.location.pathname = `/${locale}/` + parts.join('/');
    }
  }

  const currentLocale = useMemo(() => {
    if (typeof window === 'undefined') return 'en';
    const first = pathname.split('/').filter(Boolean)[0];
    return LOCALES.some((l) => l.code === first) ? first : 'en';
  }, [pathname]);

  return (
    <div className="relative">
      <select
        className="appearance-none rounded-full bg-[var(--card-bg)] pl-4 pr-10 py-2 text-sm font-medium text-[var(--foreground)] border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
        onChange={handleChange}
        value={currentLocale}
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="bg-[var(--background)] text-[var(--foreground)]">
            {l.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
}

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function Home() {
  const t = useTranslations();

  const providerNames = PROVIDERS.map((p) => p.name);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: t('app.title'),
    description: t('app.subtitle'),
    url: siteUrl,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      t('features.f1'),
      t('features.f2'),
      t('features.f3'),
      t('features.f4'),
      ...providerNames,
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: t('faq.q1'),
        acceptedAnswer: { '@type': 'Answer', text: t('faq.a1') },
      },
      {
        '@type': 'Question',
        name: t('faq.q2'),
        acceptedAnswer: { '@type': 'Answer', text: t('faq.a2') },
      },
      {
        '@type': 'Question',
        name: t('faq.q3'),
        acceptedAnswer: { '@type': 'Answer', text: t('faq.a3') },
      },
    ],
  };

  const [provider, setProvider] = useState<ProviderId>('openai');
  const meta = useMemo(() => getProviderMeta(provider), [provider]);

  const [baseUrl, setBaseUrl] = useState(meta.defaultBaseUrl);
  const [model, setModel] = useState(meta.defaultModel);
  const [concurrency, setConcurrency] = useState(10);
  const [prompt, setPrompt] = useState(
    'Please briefly introduce yourself, including your model name, version, context window size, key capabilities, and any other basic information. Keep your response concise.'
  );
  const [lowThreshold, setLowThreshold] = useState(1);
  const [models, setModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelFetchInfo, setModelFetchInfo] = useState<ModelFetchInfo | null>(null);

  const [keyText, setKeyText] = useState('');
  const [running, setRunning] = useState(false);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  function onProviderChange(id: ProviderId) {
    setProvider(id);
    const p = getProviderMeta(id);
    setBaseUrl(p.defaultBaseUrl);
    setModel(p.defaultModel);
    setRows([]);
    setDone(0);
    setTotal(0);
    setModelFetchInfo(null);
  }

  async function start() {
    const keys = parseKeys(keyText);
    setRows([]);
    setTotal(keys.length);
    setDone(0);

    if (keys.length === 0) return;

    setRunning(true);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          baseUrl,
          model,
          keys,
          concurrency,
          validationPrompt: prompt,
          lowThreshold
        }),
        signal: ac.signal
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line) continue;
          const evt = JSON.parse(line);
          if (evt.type === 'meta') {
            setTotal(evt.total);
          } else if (evt.type === 'result') {
            setDone(evt.done);
            setRows((prev) => [evt.result as Row, ...prev]);
          } else if (evt.type === 'done') {
            setDone(evt.done);
          }
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error(e);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function fetchModels() {
    const keys = parseKeys(keyText);
    if (keys.length === 0) return;
    setFetchingModels(true);
    setModelFetchInfo(null);
    const baseUrlInput = baseUrl;
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, baseUrl, keys })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.models) {
        setModels(data.models);
        if (data.models.length && !data.models.includes(model)) {
          setModel(data.models[0]);
        }
        const resolvedBaseUrl = data.baseUrl || baseUrlInput;
        const baseUrlChanged = data.baseUrl && data.baseUrl !== baseUrlInput;
        if (baseUrlChanged) {
          setBaseUrl(data.baseUrl);
        }
        const resolvedText = baseUrlChanged
          ? `${t('provider.baseUrl')}: ${baseUrlInput} -> ${resolvedBaseUrl}`
          : `${t('provider.baseUrl')}: ${resolvedBaseUrl}`;
        setModelFetchInfo({ kind: 'success', text: resolvedText });
      } else {
        setModels([]);
        const message = data?.message || `Request failed: ${res.status}`;
        setModelFetchInfo({ kind: 'error', text: message });
      }
    } finally {
      setFetchingModels(false);
    }
  }

  async function importFile(file: File) {
    const text = await file.text();
    setKeyText((prev) => (prev ? prev + '\n' + text : text));
  }

  const stats = useMemo(() => {
    let valid = 0, invalid = 0, rate = 0, low = 0, zero = 0, noBalance = 0, other = 0;
    for (const r of rows) {
      if (r.status === 'valid') valid++;
      else if (r.status === 'invalid') invalid++;
      else if (r.status === 'rate_limited') rate++;
      else if (r.status === 'low') low++;
      else if (r.status === 'zero') zero++;
      else if (r.status === 'no_balance') noBalance++;
      else other++;
    }
    return { valid, invalid, rate, low, zero, noBalance, other };
  }, [rows]);

  const listParentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 36,
    overscan: 10
  });

  return (
    <main className="min-h-screen text-[var(--foreground)] selection:bg-indigo-500/30 pb-20 transition-colors duration-300">
      <JsonLd data={jsonLd} />
      <JsonLd data={faqJsonLd} />
      
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* Header Section */}
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-sm">
              {t('app.title')}
            </h1>
            <p className="text-[var(--muted-foreground)] text-lg max-w-lg leading-relaxed">
              {t('app.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Selenium39/llm-api-key-checker-next"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[var(--card-bg)] p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--glass-border)] transition-colors"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <ThemeSwitcher />
            <LocaleSwitcher />
          </div>
        </header>

        {/* Main Content: Left/Right Split */}
        <div className="relative flex flex-col lg:flex-row gap-6 min-h-[800px]">
          
          {/* LEFT COLUMN: Input & Config */}
          <div className="flex flex-col gap-6 w-full lg:w-[calc(50%-12px)]">
            
            {/* Configuration Panel */}
            <section className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:shadow-indigo-500/10 hover:border-indigo-500/20">
              <div className="flex items-center gap-2 mb-6 border-b border-[var(--border)] pb-4">
                <div className="size-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-300">{t('provider.title')}</h2>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <div className="mb-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{t('provider.providerLabel')}</div>
                    <div className="relative">
                      <select
                        className="glass-input w-full rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-indigo-500/50"
                        value={provider}
                        onChange={(e) => onProviderChange(e.target.value as ProviderId)}
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p.id} value={p.id} className="bg-[var(--background)] text-[var(--foreground)]">
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <div className="mb-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{t('provider.baseUrl')}</div>
                    <input
                      className="glass-input w-full rounded-xl px-4 py-3"
                      value={baseUrl}
                      onChange={(e) => {
                        setBaseUrl(e.target.value);
                        setModelFetchInfo(null);
                      }}
                      placeholder="https://api.example.com"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{t('provider.model')}</span>
                      <button
                        type="button"
                        onClick={fetchModels}
                        disabled={fetchingModels || parseKeys(keyText).length === 0}
                        className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 hover:text-indigo-400 disabled:opacity-40 transition-colors flex items-center gap-1"
                      >
                        {fetchingModels ? (
                          <span className="animate-spin">⟳</span>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16l5 5" /><path d="M21 21v-5h-5" /></svg>
                        )}
                        {t('provider.fetchModels')}
                      </button>
                    </div>

                    <div className="relative">
                      {models.length ? (
                        <select
                          className="glass-input w-full rounded-xl px-4 py-3 appearance-none"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                        >
                          {models.map((m) => (
                            <option key={m} value={m} className="bg-[var(--background)] text-[var(--foreground)]">
                              {m}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="glass-input w-full rounded-xl px-4 py-3"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                        />
                      )}
                      {models.length > 0 && <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>}
                    </div>
                    {modelFetchInfo && (
                      <div className={`mt-2 text-[11px] break-all ${modelFetchInfo.kind === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {modelFetchInfo.text}
                      </div>
                    )}
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <div className="mb-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wide truncate" title={t('provider.concurrency')}>{t('provider.concurrency')}</div>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        className="glass-input w-full rounded-xl px-4 py-3"
                        value={concurrency}
                        onChange={(e) => setConcurrency(Number(e.target.value))}
                      />
                    </label>
                    <label className="block">
                      <div className="mb-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wide truncate" title={t('results.lowThreshold')}>{t('results.lowThreshold')}</div>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="glass-input w-full rounded-xl px-4 py-3"
                        value={lowThreshold}
                        onChange={(e) => setLowThreshold(Number(e.target.value))}
                      />
                    </label>
                  </div>
                </div>

                <label className="block">
                  <div className="mb-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{t('provider.prompt')}</div>
                  <input
                    className="glass-input w-full rounded-xl px-4 py-3"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={start}
                    disabled={running}
                    className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {t('provider.start')}
                  </button>
                  <button
                    onClick={stop}
                    disabled={!running}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-3 text-sm font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    {t('provider.stop')}
                  </button>
                </div>

                {total > 0 && (
                  <div className="mt-2 text-center text-xs font-medium text-[var(--muted-foreground)]">
                    Processing {done} / {total}
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                        style={{ width: `${Math.min((done / total) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

             {/* Keys Input Panel - Moved to Left Column for Balance */}
             <section className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:shadow-indigo-500/10 hover:border-indigo-500/20 flex flex-col flex-1">
              <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">{t('keys.title')}</h2>
                </div>
                <label className="cursor-pointer rounded-lg border border-[var(--glass-border)] bg-[var(--card-bg)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                  {t('keys.importFile')}
                  <input
                    type="file"
                    accept=".txt,text/plain"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) await importFile(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              <textarea
                className="glass-input min-h-[200px] flex-1 w-full rounded-xl p-4 font-mono text-xs leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted)] focus:ring-2 focus:ring-emerald-500/30"
                placeholder={t('keys.placeholder')}
                value={keyText}
                onChange={(e) => setKeyText(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1.5"><span className="size-1 rounded-full bg-[var(--muted)]" /> {t('keys.parsed')}: <span className="text-[var(--foreground)]">{parseKeys(keyText).length}</span></span>
                <span className="flex items-center gap-1.5"><span className="size-1 rounded-full bg-[var(--muted)]" /> {t('keys.providerKind')}: <span className="text-[var(--foreground)]">{meta.kind}</span></span>
                {meta.supportsBalance && <span className="flex items-center gap-1.5"><span className="size-1 rounded-full bg-emerald-500" /> {t('keys.balanceEnabled')}</span>}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="flex flex-col w-full lg:w-[calc(50%-12px)] lg:absolute lg:right-0 lg:top-0 lg:bottom-0">
            <section className="glass-panel rounded-2xl p-6 flex flex-col h-[600px] lg:h-full">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">{t('results.title')}</h2>
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] md:text-xs">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{t('results.valid')}: {stats.valid}</span>
                  <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">{t('results.low')}: {stats.low}</span>
                  <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-600 dark:text-red-400 border border-red-500/20">{t('results.invalid')}: {stats.invalid}</span>
                </div>
              </div>

              <div className="flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] flex flex-col">
                <div className="grid grid-cols-12 bg-[var(--glass-bg)] px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)] shrink-0">
                  <div className="col-span-4">{t('results.colKey')}</div>
                  <div className="col-span-2 text-center">{t('results.colStatus')}</div>
                  <div className="col-span-2 text-right pr-4">{t('results.colBalance')}</div>
                  <div className="col-span-4">{t('results.colMessage')}</div>
                </div>
                <div ref={listParentRef} className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
                  {rows.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--muted)] min-h-[300px]">
                      <div className="rounded-full bg-[var(--glass-highlight)] p-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                      </div>
                      <p>{t('results.empty')}</p>
                    </div>
                  ) : (
                    <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
                      {rowVirtualizer.getVirtualItems().map((vi) => {
                        const r = rows[vi.index];
                        const isEven = vi.index % 2 === 0;
                        const statusLabel =
                          r.status === 'valid'
                            ? t('results.valid')
                            : r.status === 'low'
                              ? t('results.low')
                              : r.status === 'zero'
                                ? t('results.zero')
                                : r.status === 'no_balance'
                                  ? t('results.noBalance')
                                  : r.status === 'invalid'
                                    ? t('results.invalid')
                                    : r.status === 'rate_limited'
                                      ? t('results.rateLimited')
                                      : r.status;

                        const statusClass =
                          r.status === 'valid'
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : r.status === 'low'
                              ? 'text-yellow-600 dark:text-yellow-300 bg-yellow-500/10 border-yellow-500/20'
                              : r.status === 'zero'
                                ? 'text-orange-600 dark:text-orange-300 bg-orange-500/10 border-orange-500/20'
                                : r.status === 'no_balance'
                                  ? 'text-zinc-500 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                                  : r.status === 'invalid'
                                    ? 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20'
                            : r.status === 'rate_limited'
                              ? 'text-amber-600 dark:text-amber-300 bg-amber-500/10 border-amber-500/20'
                              : 'text-zinc-400 bg-zinc-500/10';

                        const messageText = r.message ? (r.message.startsWith('error.') ? t(r.message) : r.message) : '';
                        const rawText = formatRaw(r.raw);
                        const displayText = rawText ? (messageText ? `${messageText} | ${rawText}` : rawText) : messageText;

                        return (
                          <div
                            key={r.key}
                            className={`grid grid-cols-12 items-center gap-2 border-b border-[var(--border)] px-4 py-2.5 text-xs transition-colors hover:bg-[var(--glass-highlight)] ${isEven ? 'bg-transparent' : 'bg-[var(--glass-highlight)]/30'}`}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              transform: `translateY(${vi.start}px)`
                            }}
                          >
                            <div className="col-span-4 font-mono text-[var(--foreground)] truncate opacity-90" title={r.key}>
                              {r.key}
                            </div>
                            <div className="col-span-2 text-center">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium border ${statusClass}`}>{statusLabel}</span>
                            </div>
                            <div className="col-span-2 font-mono text-[var(--foreground)] text-right pr-4">{typeof r.balance === 'number' ? r.balance : '-'}</div>
                            <div
                              className="col-span-4 truncate break-words text-[var(--muted-foreground)] transform transition-all duration-300 hover:text-[var(--foreground)] hover:bg-[var(--background)] hover:absolute hover:z-10 hover:p-2 hover:rounded-md hover:shadow-xl hover:left-1/2 hover:w-1/2 hover:overflow-visible hover:whitespace-pre-wrap"
                              title={displayText || ''}
                            >
                              {displayText || '-'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-12 glass-panel rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-[var(--border)] pb-4">
            <div className="size-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
            <h2 className="text-base font-bold uppercase tracking-widest text-violet-600 dark:text-violet-300">FAQ</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
               <div key={i} className="rounded-xl bg-[var(--glass-bg)] p-5 border border-[var(--border)] hover:border-violet-500/30 transition-colors">
                  <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-start gap-2">
                    <span className="text-violet-500 text-lg leading-none">Q.</span>
                    {t(`faq.q${i}`)}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed pl-6">
                    {t(`faq.a${i}`)}
                  </p>
               </div>
            ))}
          </div>
        </section>

        {/* Footer Section */}
        <footer className="mt-12 text-center">
           <p className="text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-1">
              <span className="text-red-500 animate-pulse">❤</span>{' '}
              {t('footer.sponsoredBy')}{' '}
              <a
                href="https://chat-tempmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-400 font-medium hover:underline underline-offset-2 transition-colors"
              >
                {t('footer.sponsor')}
              </a>
              {t('footer.sponsoredSuffix') && ` ${t('footer.sponsoredSuffix')}`}
            </p>
             <div className="mt-4 text-xs text-[var(--muted)]">
                &copy; {new Date().getFullYear()} LLM API Key Checker. Open Source on GitHub.
             </div>
        </footer>

      </div>
    </main>
  );
}
