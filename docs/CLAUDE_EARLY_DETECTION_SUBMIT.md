# EARLY VALUE DETECTOR — Muse Submission Path

Owner decision, 2026-11-13. The watchlist page shows two independent
evaluations side by side:

- **CORE VALUE** — the existing public observation ranking
  (`/api/stock-analysis/observation-v2`, annual EDINET facts, server-side
  model). Unchanged by this feature.
- **EARLY DETECTION** — the TUTTO EARLY VALUE CHANGE DETECTOR's weekly
  findings (QUARTERLY MOMENTUM + EARLY CHANGE), displayed in parallel.
  Its scores are never added to the CORE VALUE score.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/stock-analysis/early-detection-submit` | Authenticated submission (`preview` / `publish`) |
| GET | `/api/stock-analysis/early-detection` | Public read of the sealed projection |

## Submission format

Schema `tutto-early-detection-submission/1`, model `quarterly-momentum/1`:

```json
{
  "schema": "tutto-early-detection-submission/1",
  "model": "quarterly-momentum/1",
  "updated_at": "2026-11-16T01:43:00.000Z",
  "data_observed_at": "2026-11-15T00:00:00.000Z",
  "entries": [
    {
      "rank": 1,
      "code": "6871",
      "name": "株式会社日本マイクロニクス",
      "market": "JP",
      "momentumScore": 82,
      "dataCoverage": 90,
      "classification": "MOMENTUM_UP",
      "judgment": "STRONG_EARLY_CANDIDATE",
      "headline": "…",
      "source": {
        "label": "…",
        "url": "https://…",
        "publishedDate": "2026-11-12",
        "period": "2026年12月期 第3四半期"
      }
    }
  ],
  "entries_sha256": "<sha256 of JSON.stringify(entries)>"
}
```

Rules enforced server-side (`lib/early-detection.ts`):

- 1–10 entries, ranks sequential from 1, unique (market, code).
- JP codes `^[0-9]{3}[0-9A-Z]$`; US tickers `^[A-Z]{1,5}(\.[A-Z])?$`.
- `momentumScore` integer 0–100, non-increasing by rank.
- `dataCoverage` integer 0–100 (share of the rubric scoreable from data;
  unscored items are never guessed).
- `classification` / `judgment` from the detector v1.0 enums.
- Every entry carries its primary-source disclosure: HTTPS URL,
  publication date not after `data_observed_at`, target period.
- `entries_sha256` must equal the digest of the entries array.

The server seals the public projection (`tutto-early-detection/1`) with a
`projection_sha256`; the read path verifies the seal on every request.
There is no review gate on this path: publication is authorized by the
authenticated submission itself, and this auxiliary evaluation never feeds
the gated CORE VALUE ranking.

## Storage (existing KV binding `TOP3_RESEARCH_RUN`)

- `early-detection-public` — sealed public projection.
- `early-detection-submission-Muse` — latest submitted document (audit).

## Configuration

Cloudflare Pages secret (Owner sets it; never commit the value):

- `EARLY_DETECTION_SUBMIT_TOKEN` — at least 40 characters. The same value is
  registered in Muse's Secure Vault (connector
  `custom.tutto-early-detection-submit`) after deployment.

## Sender

`scripts/submit-early-detection.mjs` (env `EARLY_DETECTION_SUBMIT_URL`,
`EARLY_DETECTION_SUBMIT_TOKEN`), or the Muse-side helper in the connector
above. Always `preview` first; publish only when the projection is intended.
