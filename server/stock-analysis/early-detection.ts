import type { ObservationStore } from "./public-observation";
import {
  EARLY_DETECTION_CLAUDE_SUBMISSION_KEY,
  EARLY_DETECTION_KEY,
  EARLY_DETECTION_MODEL,
  EARLY_DETECTION_SCHEMA,
  EARLY_DETECTION_SUBMISSION_SCHEMA,
  earlyDetectionDigest,
  validEarlyEntries,
  verifyEarlyDetectionProjection,
  type EarlyDetectionProjection,
  type EarlyDetectionSubmission,
} from "../../lib/early-detection";

/**
 * EARLY VALUE DETECTOR publication path (Owner decision, 2026-11-13).
 *
 * The weekly detector run submits its findings — companies whose value has
 * started to change, scored with the independent QUARTERLY MOMENTUM rubric —
 * and the server validates and republishes them under its own seal. Unlike
 * the CORE VALUE ranking there is no server-side scoring model here: the
 * momentum scores are Muse's detector evaluation, so the submission must
 * carry, per entry, the primary-source disclosure it rests on (label, URL,
 * publication date, target period). Entries without a verifiable source
 * shape are rejected. Scores are never mixed into the CORE VALUE ranking.
 */

const timestamp = (x: unknown): x is string =>
  typeof x === "string" && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(x) && Number.isFinite(Date.parse(x));

export async function buildEarlyDetectionProjection(value: unknown): Promise<EarlyDetectionProjection> {
  const s = value as EarlyDetectionSubmission;
  if (
    !s || typeof s !== "object" ||
    s.schema !== EARLY_DETECTION_SUBMISSION_SCHEMA || s.model !== EARLY_DETECTION_MODEL ||
    !timestamp(s.updated_at) || !timestamp(s.data_observed_at) ||
    Date.parse(s.data_observed_at) > Date.parse(s.updated_at) ||
    typeof s.entries_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(s.entries_sha256) ||
    !validEarlyEntries(s.entries, s.data_observed_at) ||
    (await earlyDetectionDigest(s.entries)) !== s.entries_sha256
  ) {
    throw Error("EARLY_DETECTION_INPUT_INVALID");
  }
  const projection: EarlyDetectionProjection = {
    schema: EARLY_DETECTION_SCHEMA,
    mode: "EARLY_DETECTION",
    model: EARLY_DETECTION_MODEL,
    run_id: `early-${s.entries_sha256.slice(0, 24)}`,
    generated_at: s.updated_at,
    data_observed_at: s.data_observed_at,
    publication_status: "READY",
    entries: s.entries,
    integrity: { entries_sha256: s.entries_sha256 },
    projection_sha256: "",
  };
  projection.projection_sha256 = await earlyDetectionDigest(projection);
  return verifyEarlyDetectionProjection(projection);
}

/** Compute the public projection for a submission without storing anything. */
export async function previewEarlyDetectionSubmission(value: unknown): Promise<EarlyDetectionProjection> {
  return buildEarlyDetectionProjection(value);
}

/** Publish a submission: validate, then store the submitted document (audit)
 *  and the sealed projection. */
export async function publishEarlyDetectionSubmission(
  store: ObservationStore | undefined,
  value: unknown,
): Promise<EarlyDetectionProjection> {
  if (!store?.put) throw Error("EARLY_DETECTION_STORE_UNAVAILABLE");
  const projection = await buildEarlyDetectionProjection(value);
  await store.put(EARLY_DETECTION_CLAUDE_SUBMISSION_KEY, JSON.stringify(value));
  await store.put(EARLY_DETECTION_KEY, JSON.stringify(projection));
  return projection;
}

/** Public read path. Integrity is verified; there is no review gate here by
 *  design — this auxiliary evaluation is published through the authenticated
 *  Muse submission path only, and it never feeds the gated CORE ranking. */
export async function readEarlyDetection(store?: ObservationStore): Promise<EarlyDetectionProjection> {
  if (!store) throw Error("EARLY_DETECTION_STORE_UNAVAILABLE");
  return verifyEarlyDetectionProjection(await store.get(EARLY_DETECTION_KEY, "json"));
}
