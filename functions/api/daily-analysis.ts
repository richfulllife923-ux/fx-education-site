import {
  parseDailyAnalysisDraft,
  parsePublishedDailyAnalysis,
  type PublishedDailyAnalysis,
} from "../../lib/daily-analysis-content";

const ARTICLE_KEY = "daily-stock-analysis:published-v1";
const INDEX_KEY = "daily-stock-analysis:archive-index-v1";
const ARCHIVE_KEY_PREFIX = "daily-stock-analysis:archive-v1:";
const ARCHIVE_ID_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}(-\d+)?$/;
const MAX_BODY_BYTES = 24 * 1024;

type ArchiveIndexEntry = {
  id: string;
  date: string;
  title: string;
  companyName: string;
  ticker: string;
  publishedAt: string;
};

function archiveItemKey(id: string): string {
  return `${ARCHIVE_KEY_PREFIX}${id}`;
}

function parseArchiveIndex(value: unknown): ArchiveIndexEntry[] | null {
  if (!Array.isArray(value)) return null;
  const entries: ArchiveIndexEntry[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return null;
    const entry = item as Record<string, unknown>;
    if (
      typeof entry.id !== "string" ||
      !ARCHIVE_ID_PATTERN.test(entry.id) ||
      typeof entry.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
      typeof entry.title !== "string" ||
      entry.title.length === 0 ||
      typeof entry.companyName !== "string" ||
      entry.companyName.length === 0 ||
      typeof entry.ticker !== "string" ||
      entry.ticker.length === 0 ||
      typeof entry.publishedAt !== "string" ||
      !Number.isFinite(Date.parse(entry.publishedAt))
    ) {
      return null;
    }
    entries.push({
      id: entry.id,
      date: entry.date,
      title: entry.title,
      companyName: entry.companyName,
      ticker: entry.ticker,
      publishedAt: entry.publishedAt,
    });
  }
  return entries;
}

function nextArchiveId(index: ArchiveIndexEntry[], date: string): string {
  let max = 0;
  for (const entry of index) {
    if (entry.id === date) {
      max = Math.max(max, 1);
    } else if (entry.id.startsWith(`${date}-`)) {
      const suffix = Number(entry.id.slice(date.length + 1));
      if (Number.isInteger(suffix)) max = Math.max(max, suffix);
    }
  }
  return max === 0 ? date : `${date}-${max + 1}`;
}

async function saveArchive(store: Store, article: PublishedDailyAnalysis): Promise<void> {
  const stored = await store.get(INDEX_KEY, "json");
  let index: ArchiveIndexEntry[] = [];
  if (stored !== null && stored !== undefined) {
    const parsed = parseArchiveIndex(stored);
    if (!parsed) throw new Error("ARCHIVE_INDEX_INVALID");
    index = parsed;
  }
  const existing = index.find(
    (entry) => entry.date === article.date && entry.publishedAt === article.publishedAt,
  );
  const id = existing ? existing.id : nextArchiveId(index, article.date);
  await store.put(archiveItemKey(id), JSON.stringify(article));
  if (!existing) {
    index.push({
      id,
      date: article.date,
      title: article.title,
      companyName: article.companyName,
      ticker: article.ticker,
      publishedAt: article.publishedAt,
    });
    index.sort(
      (left, right) =>
        Date.parse(right.publishedAt) - Date.parse(left.publishedAt) ||
        (left.id < right.id ? 1 : -1),
    );
    await store.put(INDEX_KEY, JSON.stringify(index));
  }
}

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
      if (url.searchParams.get("archive") === "1") {
        const stored = await env.TOP3_RESEARCH_RUN.get(INDEX_KEY, "json");
        if (stored === null || stored === undefined) return json({ status: "empty" });
        const items = parseArchiveIndex(stored);
        return items
          ? json({ status: "ready", items })
          : json({ status: "unavailable", code: "CONTENT_INVALID" }, 503);
      }
      const archiveId = url.searchParams.get("id");
      if (archiveId !== null) {
        if (!ARCHIVE_ID_PATTERN.test(archiveId)) return json({ status: "empty" });
        const stored = await env.TOP3_RESEARCH_RUN.get(archiveItemKey(archiveId), "json");
        if (stored === null || stored === undefined) return json({ status: "empty" });
        const article = parsePublishedDailyAnalysis(stored);
        return article
          ? json({ status: "ready", article })
          : json({ status: "unavailable", code: "CONTENT_INVALID" }, 503);
      }
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

  const body = await readBody(request);
  const draft = parseDailyAnalysisDraft(body);
  if (!draft) return json({ status: "error", code: "ARTICLE_INVALID" }, 400);

  try {
    if (url.searchParams.get("archive_only") === "1") {
      const published = parsePublishedDailyAnalysis(body);
      const article: PublishedDailyAnalysis = {
        ...draft,
        publishedAt: published ? published.publishedAt : new Date().toISOString(),
      };
      await saveArchive(env.TOP3_RESEARCH_RUN, article);
      return json({ status: "ready", article }, 201);
    }
    const stored = await env.TOP3_RESEARCH_RUN.get(ARTICLE_KEY, "json");
    if (stored !== null && stored !== undefined) {
      const current = parsePublishedDailyAnalysis(stored);
      if (!current) return json({ status: "unavailable", code: "CONTENT_INVALID" }, 503);
      if (current.date > draft.date) return json({ status: "error", code: "OLDER_ARTICLE" }, 409);
    }
    const article: PublishedDailyAnalysis = { ...draft, publishedAt: new Date().toISOString() };
    await env.TOP3_RESEARCH_RUN.put(ARTICLE_KEY, JSON.stringify(article));
    await saveArchive(env.TOP3_RESEARCH_RUN, article);
    return json({ status: "ready", article }, 201);
  } catch {
    return json({ status: "unavailable", code: "STORAGE_UNAVAILABLE" }, 503);
  }
}
