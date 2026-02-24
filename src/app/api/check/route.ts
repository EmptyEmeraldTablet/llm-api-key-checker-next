import { NextRequest } from 'next/server';
import { checkOne, CheckRequest, CheckResult } from '@/lib/checkers';

export const runtime = 'nodejs';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function runWithConcurrency<T, R>(items: T[], concurrency: number, fn: (t: T) => Promise<R>, onResult: (r: R) => void) {
  let idx = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      const r = await fn(items[i]);
      onResult(r);
    }
  });
  await Promise.all(workers);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CheckRequest;
  const keys = Array.isArray(body.keys) ? body.keys : [];
  const concurrency = clamp(Number(body.concurrency || 10), 1, 50);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      };

      send({ type: 'meta', total: keys.length, provider: body.provider });

      let done = 0;
      await runWithConcurrency(
        keys,
        concurrency,
        async (k) => {
          return await checkOne({
            provider: body.provider,
            baseUrl: body.baseUrl,
            model: body.model,
            key: k,
            prompt: body.validationPrompt,
            endpointSuffix: body.endpointSuffix,
            lowThreshold: typeof body.lowThreshold === 'number' ? body.lowThreshold : undefined
          });
        },
        (result) => {
          done++;
          send({ type: 'result', done, result });
        }
      );

      send({ type: 'done', done });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
