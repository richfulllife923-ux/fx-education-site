# TUTTO FREE DATA — local audit

Date: 2026-10-01 JST. Local implementation is reviewable. FREE MVP acceptance is NOT complete because SEC live access from this environment is refused (HTTP 403). No commit, push or deployment was executed.

| Required flag | Result |
|---|---|
| EDINET_CONNECTED | YES — official v2 authenticated document-list and XBRL ZIP retrieval |
| SEC_CONNECTED | NO — current configured requests return HTTP 403 |
| 7203_E2E | PASS — official EDINET → actual consolidated financials → shared engine → browser; FY ended 2026-03-31 |
| NVDA_E2E | BLOCKED — current SEC live access denied; official-snapshot normalization passed separately |
| AAPL_E2E | BLOCKED — current SEC live access denied |
| 285A_E2E | PASS — official EDINET → actual consolidated financials → shared engine → browser; FY ended 2026-03-31 |
| FREE_DATA_MODE | YES — default mode, optional EODHD integration retained |
| PAID_PROVIDER_REQUIRED | NO |
| REALTIME_PRICE_REQUIRED | NO |
| FAKE_DATA | NO — runtime does not import fixtures or invent financial values |
| BUILD | PASS — Next static build, 34 generated pages |
| TYPESCRIPT | PASS — npm run typecheck |
| REGRESSION | PASS — 43 existing backend tests + 30 free-source tests; protected-route browser checks |
| COMMIT_EXECUTED | NO |
| PUSH_EXECUTED | NO |
| DEPLOY_EXECUTED | NO |

## Actual EDINET verification
The user-provided server key was found in the adjacent file fx-education-site-integration.dev.vars and copied, without displaying its value, into the correct ignored project .dev.vars. The existing adjacent file was preserved. The key is not stored in source, output pages, examples, public responses or test fixtures.

Official issuer registry: 3,811 domestic listed security-code entries, snapshot 2026-09-30. Toyota E02144 / 7203; Kioxia E35948 / 285A. JP identifiers do not assert an exchange venue.

Official filing index: 12,435 financial filings, contiguous submission-date coverage from 2025-06-01 through 2026-10-01. Retrieved sequentially with a 1.1-second interval and resumable date checkpoints. The current index contains no secret URLs/keys. It must be refreshed before it becomes stale; the handler checks recent updates and selected-document original-day metadata.

Real annual documents:
- Toyota: S100Y8NY (FY2026-03-31; submitted 2026-06-10) and S100VWVY (FY2025-03-31; submitted 2025-06-18).
- Kioxia: S100YJ18 (FY2026-03-31; submitted 2026-06-24) and S100W440 (FY2025-03-31; submitted 2025-06-26).
- Half-year documents were handled separately using XBRL dates, not the full-fiscal-year date range in EDINET list metadata.

Toyota's custom TotalNetRevenuesIFRS was reviewed against its official Japanese and English label linkbases before mapping. The mapping is issuer-restricted; unrelated custom extensions remain UNKNOWN. Toyota cash CapEx/FCF and total Debt/net cash remain held where a complete compatible input is not mapped. No noncash capital-expenditure note or partial borrowing total is substituted.

Kioxia's standard IFRS revenue, operating/net profit, operating/investing/financing CF, cash PP&E acquisition expenditure, balance sheet and EPS fields were retrieved where disclosed. The final engine retains source tags/context dates, units, filing IDs and calculation traces.

Both browser runs used the real same-origin Pages handler and real API providers, with no mocked financial data or snapshot fallback. Numeric market ambiguity during a blocked SEC check was explicitly resolved by choosing the verified Japanese candidate. Actual latest annual fiscal date shown for both companies is 2026-03-31. FACT/CALCULATION/UNKNOWN distinctions, LIMITED valuation, mandatory counter-thesis, all 12 sections, retry/error handling, no 375px horizontal overflow and no browser runtime errors were checked.

## SEC verification boundary
SEC_CONTACT_EMAIL is read from the environment. The supplied public email is present only in ignored local server configuration, not hardcoded in runtime source or client output. The declared application User-Agent includes that contact. SEC Companyfacts/Submissions and official ticker mappings are implemented; no SEC API key or paid provider is introduced.

Current requests from this connection receive the SEC/Akamai undeclared-automated-tool HTTP 403 response even with application/contact declaration. The adapter reports a safe access/configuration error, cancels unread failure bodies and enforces a cooldown rather than retrying every visitor. No alternative scraping provider, rotating identity, fabricated replacement or hidden demo fallback is used.

A previously downloaded official NVDA Companyfacts snapshot normalized successfully: CIK0001045810, five annual periods, latest fiscal end 2026-01-25 and filing accession 0001045810-26-000021. The OCF−reported productive-asset acquisition expenditure calculation passed. This explicitly offline result does NOT establish current live connectivity or NVDA browser E2E.

The live-free browser suite records each symbol separately and exits nonzero while SEC symbols are BLOCKED. That is an accurate unresolved external-data result, not a claimed all-green live run. Current evidence: .stock-test-output/live-free-results.json; real EDINET reports/screenshots: live-free-7203-report.json, live-free-285A-report.json and corresponding mobile PNGs. These are ignored local QA artifacts.

## Checks
- 73 backend cases passed: 43 preserved EODHD/canonical cases and 30 FREE/primary-source cases.
- TypeScript passed after actual JSON index and corrected fiscal-period handling.
- Final static build passed, 34 pages exported.
- Protected-page regression: ten routes at 320/375/768/1280px, plus loaded stock analysis/comparison/watchlist/emerging cases.
- Existing Framework 768px scrollWidth 832 and Manifesto 1280px scrollWidth 1312 match previously published baselines; shared CSS/protected source were not changed.
- Browser runtime errors: none.
- Web-API ESM Pages handler bundles without Node imports, test imports or new runtime dependencies. Actual Cloudflare runtime/deployment is outside this phase.
- Git HEAD remains the original 9654190a528930f7a820762ac6e464217b55c775. No commit/push/deploy and no package/config/other-page changes.

## Remaining before FREE MVP acceptance
Restore permitted SEC access from the execution environment and rerun tests/stock-analysis/live-free.cjs with configured SEC_CONTACT_EMAIL. Both NVDA and 7203 must pass actual-data→engine→browser before the MVP is marked complete. AAPL remains an additional required live verification; 285A already passed.

For any later owner-approved public deployment, maintain the EDINET issuer/index snapshots or optional index binding, provision server-only variables and verify aggregate provider request limits across deployed instances. No Cloudflare settings, KV data or public site were changed here.

Implementation/settings/official-source references: [FREE data migration guide](TUTTO_STOCK_ANALYSIS_FREE_DATA_MIGRATION.md). Earlier EODHD-only architecture/mapping/audit records are historical integration baselines; this report supersedes their default-mode and connectivity status.
