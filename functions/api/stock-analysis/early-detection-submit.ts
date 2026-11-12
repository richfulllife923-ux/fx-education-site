import {
  previewEarlyDetectionSubmission,
  publishEarlyDetectionSubmission,
  readEarlyDetection,
} from "../../../server/stock-analysis/early-detection";
import type { ObservationStore } from "../../../server/stock-analysis/public-observation";
import type { EarlyDetectionProjection } from "../../../lib/early-detection";

/**
 * Muse submission endpoint for the EARLY VALUE DETECTOR parallel display.
 *
 * The weekly detector run submits 5-10 companies whose value has started to
 * change (schema "tutto-early-detection-submission/1"), each with its
 * QUARTERLY MOMENTUM score and the primary-source disclosure behind it.
 * Modes:
 * - "preview": validate and return the public projection. Nothing is stored.
 * - "publish": validate, store the submission and the sealed projection,
 *   then re-read through the public read path before answering.
 *
 * This path is independent of the CORE VALUE public observation ranking and
 * never writes to its keys. See docs/CLAUDE_EARLY_DETECTION_SUBMIT.md.
 */

const MAX_BODY_BYTES = 1024 * 1024;

type Env = {
  TOP3_RESEARCH_RUN?: ObservationStore;
  EARLY_DETECTION_SUBMIT_TOKEN?: string;
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

const INPUT_ERRORS = new Set(["EARLY_DETECTION_INPUT_INVALID", "EARLY_DETECTION_INVALID", "EARLY_DETECTION_INTEGRITY_FAILED"]);

export async function onRequest({ request, env }: Context): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return json({ status: "error", code: "ORIGIN_NOT_ALLOWED" }, 403);

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ status: "error", code: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", Allow: "POST", "Cache-Control": "no-store" },
    });
  }

  const expected = env.EARLY_DETECTION_SUBMIT_TOKEN;
  if (!expected || expected.length < 40 || !env.TOP3_RESEARCH_RUN) {
    return json({ status: "unavailable", code: "PUBLISHING_NOT_CONFIGURED" }, 503);
  }
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(request.headers.get("Authorization") ?? "");
  if (!match || !(await validToken(match[1], expected))) return json({ status: "error", code: "UNAUTHORIZED" }, 401);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ status: "error", code: "JSON_REQUIRED" }, 415);
  }

  const body = await readBody(request);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ status: "error", code: "SUBMISSION_INVALID" }, 400);
  }
  const { mode, submission } = body as { mode?: unknown; submission?: unknown };
  if (mode !== "preview" && mode !== "publish") return json({ status: "error", code: "MODE_INVALID" }, 400);
  if (submission === undefined) return json({ status: "error", code: "EARLY_DETECTION_INPUT_INVALID" }, 400);

  try {
    if (mode === "preview") {
      const projection: EarlyDetectionProjection = await previewEarlyDetectionSubmission(submission);
      return json({ status: "preview", projection }, 200);
    }
    const projection = await publishEarlyDetectionSubmission(env.TOP3_RESEARCH_RUN, submission);
    const confirmed = await readEarlyDetection(env.TOP3_RESEARCH_RUN);
    if (confirmed.projection_sha256 !== projection.projection_sha256) {
      return json({ status: "unavailable", code: "PUBLICATION_UNCONFIRMED" }, 503);
    }
    return json({ status: "ready", projection: confirmed }, 201);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (INPUT_ERRORS.has(code)) return json({ status: "error", code }, 400);
    return json({ status: "unavailable", code: "STORAGE_UNAVAILABLE" }, 503);
  }
}
