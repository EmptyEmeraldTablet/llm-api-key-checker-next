import { getProviderMeta, ProviderId } from './providers';

export type CheckRequest = {
  provider: ProviderId;
  baseUrl: string;
  model: string;
  keys: string[];
  concurrency: number;
  validationPrompt?: string;
  lowThreshold?: number; // for status classification
  enableStream?: boolean;
};

export type CheckResult = {
  key: string;
  ok: boolean;
  status:
    | 'valid'
    | 'invalid'
    | 'rate_limited'
    | 'unknown_error'
    | 'low'
    | 'zero'
    | 'no_balance';
  message?: string;
  balance?: number; // -1 means unavailable
  raw?: unknown;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

function shouldTryV1Fallback(baseUrl: string, res: Response) {
  if (normalizeBaseUrl(baseUrl).endsWith('/v1')) return false;
  return res.status === 404 || res.status === 405;
}

async function readBody(res: Response) {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorInfo(raw: unknown): { message?: string; code?: string; type?: string } {
  if (!raw) return {};
  if (typeof raw === 'string') return { message: raw };
  if (typeof raw !== 'object') return { message: String(raw) };

  const obj: any = raw;
  const err = obj?.error ?? obj?.err ?? (Array.isArray(obj?.errors) ? obj.errors[0] : undefined);

  const message =
    (typeof err?.message === 'string' && err.message) ||
    (typeof obj?.message === 'string' && obj.message) ||
    (typeof err === 'string' && err) ||
    (typeof obj?.error === 'string' && obj.error) ||
    (typeof obj?.error_message === 'string' && obj.error_message) ||
    (typeof obj?.error_msg === 'string' && obj.error_msg);

  const code =
    (typeof err?.code === 'string' && err.code) ||
    (typeof obj?.code === 'string' && obj.code) ||
    (typeof obj?.error_code === 'string' && obj.error_code);

  const type =
    (typeof err?.type === 'string' && err.type) ||
    (typeof obj?.type === 'string' && obj.type);

  return { message, code, type };
}

function classifyError(res: Response, raw: unknown) {
  if (res.status === 401 || res.status === 403) return 'invalid' as const;
  if (res.status === 429) return 'rate_limited' as const;

  const info = extractErrorInfo(raw);
  const text = [info.message, info.code, info.type].filter(Boolean).join(' ').toLowerCase();
  if (text.includes('rate limit') || text.includes('too many requests') || text.includes('quota')) return 'rate_limited' as const;
  if (text.includes('invalid') || text.includes('unauthorized') || text.includes('authentication') || text.includes('api key') || text.includes('apikey')) {
    return 'invalid' as const;
  }
  return 'unknown_error' as const;
}

function isErrorPayload(raw: unknown) {
  if (!raw || typeof raw !== 'object') return false;
  const obj: any = raw;
  if (obj.error || obj.err) return true;
  if (obj.object === 'error') return true;
  if (obj.type === 'error') return true;
  if (Array.isArray(obj.errors) && obj.errors.length > 0) return true;
  return false;
}

function isOpenAIChatResponse(raw: unknown) {
  if (!raw || typeof raw !== 'object') return false;
  const obj: any = raw;
  return Array.isArray(obj.choices) && obj.choices.length > 0;
}

function isAnthropicMessageResponse(raw: unknown) {
  if (!raw || typeof raw !== 'object') return false;
  const obj: any = raw;
  if (obj.type === 'message') return true;
  return Array.isArray(obj.content) && obj.content.length > 0;
}

async function checkOpenAICompatibleKey(req: { baseUrl: string; model: string; key: string; prompt?: string }) {
  async function requestOnce(baseUrl: string) {
    const url = `${normalizeBaseUrl(baseUrl)}/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${req.key}`,
      },
      body: JSON.stringify({
        model: req.model,
        messages: [{ role: 'user', content: req.prompt || 'Hi' }],
        max_tokens: 1,
        stream: false,
      }),
    });
    const raw = await readBody(res);
    return { res, raw };
  }

  const primary = await requestOnce(req.baseUrl);
  const primaryOk = primary.res.ok && isOpenAIChatResponse(primary.raw) && !isErrorPayload(primary.raw);
  if (primaryOk) return { ok: true as const, raw: primary.raw };

  if (shouldTryV1Fallback(req.baseUrl, primary.res)) {
    const fallback = await requestOnce(`${normalizeBaseUrl(req.baseUrl)}/v1`);
    const fallbackOk = fallback.res.ok && isOpenAIChatResponse(fallback.raw) && !isErrorPayload(fallback.raw);
    if (fallbackOk) return { ok: true as const, raw: fallback.raw };
    return { ok: false as const, status: classifyError(fallback.res, fallback.raw), raw: fallback.raw };
  }

  return { ok: false as const, status: classifyError(primary.res, primary.raw), raw: primary.raw };
}

async function checkAnthropicKey(req: { baseUrl: string; model: string; key: string; prompt?: string }) {
  async function requestOnce(baseUrl: string) {
    const url = `${normalizeBaseUrl(baseUrl)}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': req.key,
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: req.prompt || 'Hi' }],
      }),
    });
    const raw = await readBody(res);
    return { res, raw };
  }

  const primary = await requestOnce(req.baseUrl);
  const primaryOk = primary.res.ok && isAnthropicMessageResponse(primary.raw) && !isErrorPayload(primary.raw);
  if (primaryOk) return { ok: true as const, raw: primary.raw };

  if (shouldTryV1Fallback(req.baseUrl, primary.res)) {
    const fallback = await requestOnce(`${normalizeBaseUrl(req.baseUrl)}/v1`);
    const fallbackOk = fallback.res.ok && isAnthropicMessageResponse(fallback.raw) && !isErrorPayload(fallback.raw);
    if (fallbackOk) return { ok: true as const, raw: fallback.raw };
    return { ok: false as const, status: classifyError(fallback.res, fallback.raw), raw: fallback.raw };
  }

  return { ok: false as const, status: classifyError(primary.res, primary.raw), raw: primary.raw };
}

async function checkBalance(provider: ProviderId, baseUrl: string, key: string): Promise<number> {
  // Best-effort, only for providers where this is known to work.
  if (provider === 'deepseek') {
    const url = `${normalizeBaseUrl(baseUrl).replace(/\/v1$/, '')}/user/balance`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } });
    if (!res.ok) return -1;
    const d: any = await res.json().catch(() => null);
    const info = d?.balance_infos?.find((b: any) => b.currency === 'USD') || d?.balance_infos?.[0];
    const bal = info?.total_balance;
    const n = Number(bal);
    return Number.isFinite(n) ? n : -1;
  }

  if (provider === 'moonshot') {
    const url = `${normalizeBaseUrl(baseUrl)}/users/me/balance`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) return -1;
    const d: any = await res.json().catch(() => null);
    const n = Number(d?.data?.available_balance);
    return Number.isFinite(n) ? n : -1;
  }

  if (provider === 'newapi') {
    const url = `${normalizeBaseUrl(baseUrl).replace(/\/v1$/, '')}/api/usage/token`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) return -1;
    const d: any = await res.json().catch(() => null);
    if (d?.code === true && d?.data) {
      const tokenToUsdRate = 500000;
      const availableUsd = Number((d.data.total_available / tokenToUsdRate).toFixed(2));
      return Number.isFinite(availableUsd) ? availableUsd : -1;
    }
    return -1;
  }

  return -1;
}

export async function checkOne(input: {
  provider: ProviderId;
  baseUrl: string;
  model: string;
  key: string;
  prompt?: string;
  lowThreshold?: number;
}): Promise<CheckResult> {
  const meta = getProviderMeta(input.provider);

  let result:
    | { ok: true; raw: unknown }
    | { ok: false; status: CheckResult['status']; raw: unknown };

  if (meta.kind === 'anthropic') {
    result = await checkAnthropicKey({ baseUrl: input.baseUrl, model: input.model, key: input.key, prompt: input.prompt });
  } else {
    result = await checkOpenAICompatibleKey({ baseUrl: input.baseUrl, model: input.model, key: input.key, prompt: input.prompt });
  }

  if (result.ok) {
    const balance = meta.supportsBalance ? await checkBalance(input.provider, input.baseUrl, input.key) : undefined;

    // Balance-based classification (only when balance is available)
    if (typeof balance === 'number') {
      if (balance === -1) {
        return { key: input.key, ok: true, status: 'no_balance', balance, raw: result.raw };
      }
      if (balance === 0) {
        return { key: input.key, ok: true, status: 'zero', balance, raw: result.raw };
      }
      const th = typeof input.lowThreshold === 'number' ? input.lowThreshold : 0;
      if (th > 0 && balance > 0 && balance < th) {
        return { key: input.key, ok: true, status: 'low', balance, raw: result.raw };
      }
    }

    return { key: input.key, ok: true, status: 'valid', balance, raw: result.raw };
  }

  const errorInfo = extractErrorInfo(result.raw);
  const fallbackMessage = result.status === 'invalid' ? 'error.invalid' : result.status === 'rate_limited' ? 'error.rateLimited' : 'error.failed';

  return {
    key: input.key,
    ok: false,
    status: result.status,
    message: errorInfo.message || errorInfo.code || fallbackMessage,
    raw: result.raw,
  };
}

export function parseKeys(text: string): string[] {
  const parts = text
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  // de-dup preserve order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}
