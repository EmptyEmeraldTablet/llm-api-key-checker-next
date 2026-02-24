import { NextRequest } from 'next/server';
import { ProviderId } from '@/lib/providers';

export const runtime = 'nodejs';

type Body = {
  provider: ProviderId;
  baseUrl: string;
  keys: string[];
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

function buildCandidateBaseUrls(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);
  const out = [normalized];
  if (normalized.endsWith('/v1')) {
    out.push(normalized.replace(/\/v1$/, ''));
  } else {
    out.push(`${normalized}/v1`);
  }
  return Array.from(new Set(out.filter(Boolean)));
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

async function tryOpenAIModels(baseUrl: string, key: string): Promise<{ models: string[] | null; status: number; raw: unknown }> {
  const url = `${normalizeBaseUrl(baseUrl)}/models`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: 'application/json'
    }
  });
  const raw = await readBody(res);
  if (!res.ok) return { models: null, status: res.status, raw };
  const d: any = raw;
  const list = d?.data;
  if (!Array.isArray(list)) return { models: null, status: res.status, raw };
  const ids = list.map((m: any) => m?.id).filter(Boolean);
  return { models: Array.from(new Set(ids)), status: res.status, raw };
}

async function tryAnthropicModels(baseUrl: string, key: string): Promise<{ models: string[] | null; status: number; raw: unknown }> {
  // Anthropic has an API endpoint /v1/models (may require newer versions/permissions).
  const url = `${normalizeBaseUrl(baseUrl)}/models`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      Accept: 'application/json'
    }
  });
  const raw = await readBody(res);
  if (!res.ok) return { models: null, status: res.status, raw };
  const d: any = raw;
  const list = d?.data;
  if (!Array.isArray(list)) return { models: null, status: res.status, raw };
  const ids = list.map((m: any) => m?.id).filter(Boolean);
  return { models: Array.from(new Set(ids)), status: res.status, raw };
}

function isLikelyOpenAICompatible(provider: ProviderId) {
  // For our MVP, treat most providers as OpenAI-compatible.
  return provider !== 'anthropic';
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const keys = Array.isArray(body.keys) ? body.keys : [];
  const candidates = buildCandidateBaseUrls(body.baseUrl);

  const out: { ok: boolean; models?: string[]; tried: number; message?: string; baseUrl?: string } = {
    ok: false,
    tried: 0
  };

  for (const k of keys) {
    if (!k) continue;
    for (const baseUrl of candidates) {
      out.tried++;
      const result = isLikelyOpenAICompatible(body.provider)
        ? await tryOpenAIModels(baseUrl, k)
        : await tryAnthropicModels(baseUrl, k);

      if (result.models && result.models.length) {
        out.ok = true;
        out.models = result.models;
        out.baseUrl = baseUrl;
        return Response.json(out);
      }
    }
  }

  out.message = `Unable to fetch models with provided keys. Tried: ${candidates.join(', ')}`;
  return Response.json(out, { status: 400 });
}
