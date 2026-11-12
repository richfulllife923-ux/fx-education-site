# Muse observation submission (preview / publish)

This path lets Muse refresh the public observation Top5 without repository
write access. It does not change the ranking display, the public read APIs, the
selection model, or Formal Research.

## Flow

- Muse prepares an input in the existing sealed format
  (`schema: "tutto-public-observation-input/1"`) from facts verified against
  primary sources (EDINET annual filings). Muse never submits ranks or
  scores.
- `POST /api/stock-analysis/observation-submit` with
  `Authorization: Bearer <OBSERVATION_SUBMIT_TOKEN>` and a JSON body
  `{ "mode": "preview" | "publish", "input": { ... } }`.
- The server computes the projection with the existing model
  (`selectTop5Observation`: strict EDINET fact checks, then the
  annual-percentile geometric-mean ranking). Ineligible rows are dropped,
  never imputed or padded.
- `preview` returns the computed projection and stores nothing.
- `publish` stores three keys in the existing KV binding:
  the submitted input under `public-observation-input-Muse` (audit),
  a provenance record under `top5-public-observation-provenance`, and the
  projection under the existing `top5-public-observation` key. It then
  re-reads through the normal gated read path and only reports success when
  the stored projection matches.

## Publication authorization

The public release gate (`verifyPublicReview`) accepts a stored projection
only when one of these matches its exact input and projection hashes:

- the legacy external JEV PRE/POST PASS receipts
  (`top5-public-observation-review`), unchanged; or
- the provenance record written by this path:
  `{ schema: "tutto-public-observation-provenance/1",
     scope: "PUBLIC_OBSERVATION_TOP5", input_sha256, projection_sha256,
     via: "CLAUDE_SUBMISSION", review: "NOT_APPLICABLE", published_at }`.

Owner decision (2026-11-12): the Muse submission path does not go through
JEV. The provenance record states this openly (`review: "NOT_APPLICABLE"`).
It is not a review receipt, and this path never creates PRE/POST records.
Anything else still fails closed with `OBSERVATION_REVIEW_HOLD`. A later
legacy refresh whose hashes do not match the stored authorization also
fails closed instead of silently overwriting a published projection.

## Input hash fields on this path

`research_full_run_sha256` and `assessment_sha256` are required format fields
of the existing input schema. For Muse-submitted inputs they carry digests
of the submitted evidence bundle, computed as:

- `research_full_run_sha256` = SHA-256 of the JSON array of each row's
  `source_sha256`, in row order.
- `assessment_sha256` = SHA-256 of the JSON of the full `rows` array.

They are recomputable from the stored input and do not claim to be Formal
Research run seals.

## Configuration

Set the encrypted `OBSERVATION_SUBMIT_TOKEN` secret (at least 40 characters)
for the production environment of the Cloudflare Pages project
`fx-education-site`, and configure the same value in Muse's private secret
store. A redeploy is required after changing the secret. Keep the token out
of source files, prompts, chat, and commit history.

Until the secret and the KV binding are available the endpoint returns
`503 PUBLISHING_NOT_CONFIGURED`. Missing or incorrect authorization returns
`401`; an invalid input returns `400` with the existing observation error
code; a cross-origin browser request returns `403 ORIGIN_NOT_ALLOWED`.
Request bodies are limited to 8 MiB.

## Client

```text
OBSERVATION_SUBMIT_URL=https://fx-education-site.pages.dev/api/stock-analysis/observation-submit \
node scripts/submit-observation.mjs <input.json> preview
```

The script sends an identifiable User-Agent
(`TUTTO-Daily-Analysis-Publisher/1.0`), which Cloudflare's Browser Integrity
Check on pages.dev requires from automated clients.

Deploy check: `functions/api/stock-analysis/observation-submit.ts` is a
static route and must win over the `[[path]]` catch-all for
`/api/stock-analysis/observation-submit`. Verify after deployment that a
tokenless POST returns `401` (or `503` before the secret is set), not `404`.
