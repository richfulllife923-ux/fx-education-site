import {
  parseDailyAnalysisDraft,
  parsePublishedDailyAnalysis,
  type PublishedDailyAnalysis,
} from "../../lib/daily-analysis-content";

const ARTICLE_KEY = "daily-stock-analysis:published-v1";
const MAX_BODY_BYTES = 24 * 1024;

type Store = {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
};

type Env = {
  TOP3_RESEARCH_RUN?: Store;
  DAILY_ANALYSIS_PUBLISH_TOKEN?: string;
};

type Context = { request: Request; env: Env };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function validToken(provided: string, expected: string): Promise<boolean> {
  if (expected.length < 40 || provided.length < 40) return false;
  const [left, right] = await Promise.all([digest(provided), digest(expected)]);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function readBody(request: Request): Promise<unknown | null> {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return null;
  }
}

export async function onRequest({ request, env }: Context): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return json({ status: "error", code: "ORIGIN_NOT_ALLOWED" }, 403);

  if (request.method === "GET") {
    if (!env.TOP3_RESEARCH_RUN) return json({ status: "unavailable", code: "STORAGE_UNAVAILABLE" }, 503);
    try {
      const stored = await env.TOP3_RESEARCH_RUN.get(ARTICLE_KEY, "json");
      if (stored === null || stored === undefined) return json({ status: "empty" });
      const article = parsePublishedDailyAnalysis(stored);
      return article
        ? json({ status: "ready", article })
        : json({ status: "unavailable", code: "CONTENT_INVALID" }, 503);
    } catch {
      return json({ status: "unavailable", code: "STORAGE_UNAVAILABLE" }, 503);
    }
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ status: "error", code: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", Allow: "GET, POST", "Cache-Control": "no-store" },
    });
  }

  const expected = env.DAILY_ANALYSIS_PUBLISH_TOKEN;
  if (!expected || expected.length < 40 || !env.TOP3_RESEARCH_RUN) {
    return json({ status: "unavailable", code: "PUBLISHING_NOT_CONFIGURED" }, 503);
  }
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(request.headers.get("Authorization") ?? "");
  if (!match || !(await validToken(match[1], expected))) return json({ status: "error", code: "UNAUTHORIZED" }, 401);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ status: "error", code: "JSON_REQUIRED" }, 415);
  }

  const draft = parseDailyAnalysisDraft(await readBody(request));
  if (!draft) return json({ status: "error", code: "ARTICLE_INVALID" }, 400);

  try {
    const stored = await env.TOP3_RESEARCH_RUN.get(ARTICLE_KEY, "json");
    if (stored !== null && stored !== undefined) {
      const current = parsePublishedDailyAnalysis(stored);
      if (!current) return json({ status: "unavailable", code: "CONTENT_INVALID" }, 503);
      if (current.date > draft.date) return json({ status: "error", code: "OLDER_ARTICLE" }, 409);
    }
    const article: PublishedDailyAnalysis = { ...draft, publishedAt: new Date().toISOString() };
    await env.TOP3_RESEARCH_RUN.put(ARTICLE_KEY, JSON.stringify(article));
    return json({ status: "ready", article }, 201);
  } catch {
    return json({ status: "unavailable", code: "STORAGE_UNAVAILABLE" }, 503);
  }
}
