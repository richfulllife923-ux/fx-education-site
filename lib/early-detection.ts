/**
 * TUTTO EARLY VALUE CHANGE DETECTOR — public parallel display.
 *
 * This is an independent auxiliary evaluation (QUARTERLY MOMENTUM + EARLY
 * CHANGE) shown alongside the annual CORE VALUE public observation ranking.
 * It is deliberately separate from lib/public-observation.ts: different
 * schema, different KV keys, no shared scores. The momentum score here is
 * never added to the CORE VALUE score (Owner decision, 2026-11-13:
 * parallel display first; integration only after validation and a separate
 * Owner decision).
 */
export const EARLY_DETECTION_SCHEMA = "tutto-early-detection/1" as const;
export const EARLY_DETECTION_SUBMISSION_SCHEMA = "tutto-early-detection-submission/1" as const;
export const EARLY_DETECTION_MODEL = "quarterly-momentum/1" as const;
export const EARLY_DETECTION_KEY = "early-detection-public";
export const EARLY_DETECTION_CLAUDE_SUBMISSION_KEY = "early-detection-submission-Muse";

export const EARLY_CLASSIFICATIONS = [
  "VALUE_UP", "VALUE_DOWN", "MOMENTUM_UP", "MOMENTUM_DOWN",
  "STRUCTURAL_CHANGE", "TEMPORARY", "UNCONFIRMED",
] as const;
export type EarlyClassification = (typeof EARLY_CLASSIFICATIONS)[number];

export const EARLY_JUDGMENTS = [
  "STRONG_EARLY_CANDIDATE", "EARLY_CANDIDATE", "WATCH", "NEUTRAL",
  "RISK", "REJECT", "DATA_INSUFFICIENT",
] as const;
export type EarlyJudgment = (typeof EARLY_JUDGMENTS)[number];

export type EarlyDetectionSource = {
  label: string;
  url: string;
  /** Disclosure (publication) date, YYYY-MM-DD. */
  publishedDate: string;
  /** Disclosure target period, free text (e.g. "2026年12月期 第3四半期"). */
  period: string;
};

export type EarlyDetectionEntry = {
  rank: number;
  code: string;
  name: string;
  market: "JP" | "US";
  /** QUARTERLY MOMENTUM score, integer 0..100. Independent of CORE VALUE. */
  momentumScore: number;
  /** Share of the rubric that could be scored from available data, 0..100. */
  dataCoverage: number;
  classification: EarlyClassification;
  judgment: EarlyJudgment;
  headline: string;
  source: EarlyDetectionSource;
};

export type EarlyDetectionSubmission = {
  schema: typeof EARLY_DETECTION_SUBMISSION_SCHEMA;
  model: typeof EARLY_DETECTION_MODEL;
  updated_at: string;
  data_observed_at: string;
  entries: EarlyDetectionEntry[];
  entries_sha256: string;
};

export type EarlyDetectionProjection = {
  schema: typeof EARLY_DETECTION_SCHEMA;
  mode: "EARLY_DETECTION";
  model: typeof EARLY_DETECTION_MODEL;
  run_id: string;
  generated_at: string;
  data_observed_at: string;
  publication_status: "READY";
  entries: EarlyDetectionEntry[];
  integrity: { entries_sha256: string };
  projection_sha256: string;
};

const hashPattern = /^[a-f0-9]{64}$/;
const timestamp = (x: unknown): x is string =>
  typeof x === "string" && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(x) && Number.isFinite(Date.parse(x));
const dateOnly = (x: unknown): x is string =>
  typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && Number.isFinite(Date.parse(x));
const text = (x: unknown, max: number): x is string =>
  typeof x === "string" && x.trim().length > 0 && x.length <= max;

export function validEarlyEntries(entries: unknown, dataObservedAt: string): entries is EarlyDetectionEntry[] {
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 10) return false;
  const seen = new Set<string>();
  return entries.every((entry, i) => {
    if (!entry || typeof entry !== "object") return false;
    const e = entry as EarlyDetectionEntry;
    const key = `${e.market}:${e.code}`;
    if (seen.has(key)) return false;
    seen.add(key);
    const codeOk = e.market === "JP"
      ? /^[0-9]{3}[0-9A-Z]$/.test(e.code ?? "")
      : e.market === "US" && /^[A-Z]{1,5}(\.[A-Z])?$/.test(e.code ?? "");
    const source = e.source as EarlyDetectionSource | undefined;
    return e.rank === i + 1 && codeOk &&
      text(e.name, 160) && text(e.headline, 300) &&
      Number.isInteger(e.momentumScore) && e.momentumScore >= 0 && e.momentumScore <= 100 &&
      (i === 0 || entries[i - 1].momentumScore >= e.momentumScore) &&
      Number.isInteger(e.dataCoverage) && e.dataCoverage >= 0 && e.dataCoverage <= 100 &&
      (EARLY_CLASSIFICATIONS as readonly string[]).includes(e.classification) &&
      (EARLY_JUDGMENTS as readonly string[]).includes(e.judgment) &&
      !!source && text(source.label, 200) && text(source.period, 60) &&
      typeof source.url === "string" && source.url.length <= 500 && source.url.startsWith("https://") &&
      dateOnly(source.publishedDate) && source.publishedDate <= dataObservedAt.slice(0, 10);
  });
}

export async function earlyDetectionDigest(value: unknown): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(b), (n) => n.toString(16).padStart(2, "0")).join("");
}

export function isEarlyDetectionProjection(x: unknown): x is EarlyDetectionProjection {
  if (!x || typeof x !== "object") return false;
  const p = x as EarlyDetectionProjection;
  return p.schema === EARLY_DETECTION_SCHEMA && p.mode === "EARLY_DETECTION" && p.model === EARLY_DETECTION_MODEL &&
    p.publication_status === "READY" &&
    typeof p.run_id === "string" && /^early-[a-f0-9]{24}$/.test(p.run_id) &&
    timestamp(p.generated_at) && timestamp(p.data_observed_at) &&
    Date.parse(p.data_observed_at) <= Date.parse(p.generated_at) &&
    !!p.integrity && hashPattern.test(p.integrity.entries_sha256) && hashPattern.test(p.projection_sha256) &&
    p.run_id === `early-${p.integrity.entries_sha256.slice(0, 24)}` &&
    validEarlyEntries(p.entries, p.data_observed_at);
}

export async function verifyEarlyDetectionProjection(value: unknown): Promise<EarlyDetectionProjection> {
  if (!isEarlyDetectionProjection(value)) throw Error("EARLY_DETECTION_INVALID");
  if (await earlyDetectionDigest({ ...value, projection_sha256: "" }) !== value.projection_sha256) {
    throw Error("EARLY_DETECTION_INTEGRITY_FAILED");
  }
  return value;
}

export async function loadEarlyDetection(signal: AbortSignal): Promise<EarlyDetectionProjection> {
  const response = await fetch("/api/stock-analysis/early-detection", { signal, cache: "no-store" });
  if (!response.ok) throw Error("EARLY_DETECTION_UNAVAILABLE");
  return verifyEarlyDetectionProjection(await response.json());
}
