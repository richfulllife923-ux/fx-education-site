# TUTTO FREE DATA migration — local implementation

Updated: 2026-10-01 JST. This document supersedes the EODHD-only defaults in the earlier backend architecture/mapping/audit documents. Commit, push and deployment are prohibited for this phase.

## Data routing and server settings
Default STOCK_DATA_MODE=FREE. US tickers use SEC EDGAR Companyfacts/Submissions; Japanese security codes use EDINET v2 document lists and the official XBRL ZIP. Existing EODHD code remains available only when STOCK_DATA_MODE=EODHD and its public-display approval/key settings are supplied.

Use server-only SEC_CONTACT_EMAIL and EDINET_API_KEY in .dev.vars for local work and corresponding server bindings for any later owner-approved deployment. Neither setting uses NEXT_PUBLIC_ and neither is returned to the browser. The supplied public SEC contact is stored only in ignored local configuration; source code reads the environment. Keys, secret request URLs and remote error bodies are not logged. .env.example contains names and empty values only.

Input normalization, aliases, exact code verification, candidate choice and canonical model are shared. JP is a geographic identifier, not proof of a TSE listing. 7203.JP / 285A.JP are explicit Japanese codes; .T and .TSE input suffixes are accepted as Japan hints. Toyota/Kioxia name aliases also specify Japan. Numeric codes without a market are checked against SEC when contact is configured; if the US check is blocked, the verified Japanese candidate is offered for an explicit selection rather than assumed. A Japanese market hint does not call SEC.

## Modules
- server/stock-analysis/sec.ts: official ticker→CIK mapping, submission identity verification, Companyfacts US-GAAP fields, accession-linked evidence.
- server/stock-analysis/edinet.ts: official issuer identity registry, date-based index, current list delta, selected-document metadata revalidation, ZIP retrieval and normalized financial periods.
- server/stock-analysis/edinet-xbrl.ts: standard EDINET J-GAAP/IFRS and standard IFRS namespace fields, issuer/context/unit validation.
- server/stock-analysis/primary-http.ts: serial queue, bounded response/cache, request coalescing, original retrieval timestamps, safe errors and one-minute denial/rate-limit cooldown.
- server/stock-analysis/zip.ts: bounded native Web API raw-deflate ZIP reader, local/central header and CRC verification.
- server/stock-analysis/free.ts: independent/lazy SEC and EDINET providers.
- Existing model/resolver/calculations/engine/service, same-origin Pages handler and stock client components retain their shared contracts.

No package or runtime dependency was installed. Runtime code uses Web APIs and does not import Node, test fixtures, Indicator internals or a server-only environment into the client.

## Evidence and accounting boundaries
Official numeric facts are FACT; derived margins, growth and OCF−CapEx are CALCULATION with input traces; conditional interpretation is INFERENCE; unavailable facts remain UNKNOWN. EODHD aggregation remains SOURCE CLAIM.

SEC flow facts require exact start/end, unit/currency, matching annual or quarterly form and plausible duration. Annual 10-K and 10-K/A facts are separate from 10-Q and 10-Q/A. Latest same-period amendments/restated comparisons take precedence; ambiguous conflicting same-day values become null. SEC fy labels are not used to infer comparative dates. Six-/nine-month cumulative values are not labeled as single quarters. Custom taxonomy extensions are outside this Companyfacts normalizer. Standard whole-entity facts only.

EDINET checks the issuer identifier including its standard branch suffix, accepts only standard namespace fields and consolidated contexts, rejects unreviewed custom/segment/nonconsolidated facts, DTD/entity declarations, future fiscal contexts, ZIP corruption and oversized input. Annual, half-year and single-quarter contexts stay separate; cumulative nine-month quarters are excluded. EDINET list periodStart/periodEnd can describe the full fiscal year even for a half-year filing, so actual financial dates come from validated XBRL contexts rather than equating list periodEnd with the half-year end. A half-year without parseable contexts cannot invalidate a separately verified annual fiscal period. Raw XBRL numeric values are not multiplied by decimals. CapEx is normalized as positive spending and its exact source tag remains visible.

Five annual periods are displayed where available. Missing debt is not replaced by liabilities or an invented sum of incomplete components. SEC current/noncurrent debt components are shown separately where disclosed; total Debt/net cash remain unknown when a validated total is absent. EPS states the selected basic/diluted source. Accounting notes, EPS split comparability, normalized earnings, maintenance versus growth investment and segment/customer narratives still need filing-body review.

Business narratives and next earnings dates are not fabricated. Filing links, filing date, fiscal period/start, currency/unit, source field/context/accession, retrieval time and related calculation inputs are shown.

FREE MODE has VALUATION_STATUS=LIMITED: 財務分析は利用可能、市場価格ベース指標は未接続. No paid provider, real-time price, quote scraping or fabricated P/E/P/B/EV/EBITDA/FCF Yield is required. Bull/Base/Bear, counter-thesis and earnings confirmation monitors remain conditional research, with no target price, score, winner or buy/sell verdict.

Toyota uses an issuer-specific TotalNetRevenuesIFRS extension. The official Japanese/English label linkbases in S100VWVY identify it as 営業収益合計 / Total net revenues (IFRS); only this exact issuer/tag pair is reviewed and allowed. Other custom extensions remain UNKNOWN. Toyota cash CapEx is not replaced by the differently scoped capital-expenditure note; when cash acquisition inputs are not completely mapped, FCF remains UNKNOWN.

## EDINET official index maintenance
EDINET has date-based filing lists, not a ticker-specific financial endpoint. The committed/bundled index is produced by the official API, never by invented document IDs or financial fixtures. Empty or more-than-seven-day stale coverage returns a configuration error rather than launching years of daily requests per visitor.

Run locally with the existing Node/TypeScript installation:

    node scripts/refresh-edinet-issuers.cjs
    node scripts/refresh-edinet-filings.cjs --max-days 31

The filing script reads EDINET_API_KEY from the process or ignored .dev.vars. Default first backfill covers up to five years; each run checkpoints complete dates and resumes at the following date. --from and --through select an explicit historical range. For the current priority verification, a contiguous range beginning 2025-06-01 is sufficient to locate two recent annual filings and their comparative periods; this does not claim five years of indexed submissions.

    node scripts/refresh-edinet-filings.cjs --from 2025-06-01 --max-days 2000

For subsequent updates, omit --from to resume. Use --from within covered history to rescan header updates where needed. Recent list delta catches new corrections. Before each selected annual/half-year/quarterly report is used, its original submission-date list is refreshed (15-minute TTL) to check withdrawal, non-disclosure and edited metadata. A correction with no complete XBRL blocks the older amounts for that fiscal end; it is not silently replaced by the original. EDINET metadata can change in older date lists; selected-document revalidation plus periodic index rescans are needed. No scheduled automation has been created.

An optional EDINET_FILING_INDEX server KV binding can supply JSON at key edinet-filings; otherwise the local generated JSON is bundled. This phase does not provision a KV store, upload its contents, change Cloudflare configuration or deploy. Index/identity snapshots should be maintained before later publication.

## Rate/caching behavior and official conditions
The local provider serializes outbound calls and spaces starts by at least 1.1 seconds. This is a conservative implementation choice; EDINET does not publish a fixed numeric allowance in the cited specification. Current document lists/Submissions cache for 15 minutes; SEC ticker mapping for 24 hours; Companyfacts for six hours with the latest filing accession in its cache key; immutable EDINET document bytes for seven days. Cache is bounded per provider/isolate; source retrieval time remains the original network time. Responses/errors are not cached into public pages. No uncontrolled fan-out or continuous retry on 403/429.

SEC's published maximum is 10 requests/second across access, not an entitlement to run each deployment at that rate. This local queue does not prove an account-wide cap across a fleet. A later multi-instance public deployment needs an aggregate outbound queue/rate control sized for total traffic. Existing optional incoming rate limiter and per-isolate request limit are separate from that aggregate control.

Primary references:
- [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- [SEC accessing EDGAR — declared bot headers and rates](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data)
- [SEC webmaster FAQ — undeclared-tool/access-denied responses](https://www.sec.gov/about/webmaster-frequently-asked-questions)
- [EDINET v2 official API specification](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf)
- [EDINET report-instance context/entity guideline](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140112.pdf)
- [EDINET usage terms / PDL1.0](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WZEK0030.html)

EDINET output cites Financial Services Agency/EDINET and labels TUTTO normalization/calculation as processing. PDL scope/exclusions are retained; no blanket relicensing of taxonomy, logos or excluded third-party content is claimed. Official API/ZIP data are used; EDINET HTML scraping is not a primary source.

## Verification commands and boundaries

    npm run typecheck
    node --test tests/stock-analysis/backend.test.cjs tests/stock-analysis/free-data.test.cjs
    npm run build
    node tests/stock-analysis/browser.test.cjs
    node tests/stock-analysis/live-free.cjs
    node tests/stock-analysis/free-snapshot.cjs <locally-retrieved-companyfacts.json>

Browser scripts need PLAYWRIGHT_MODULE pointing to an already-installed Playwright, and use installed Chrome. No dependency installation is needed in this workspace.

backend.test.cjs retains the 43 EODHD/canonical regression cases and explicitly opts into EODHD mode. free-data.test.cjs uses isolated TEST DATA only, with no production fixture route/import. It verifies period/unit selection, amendments, missing fields, safe errors/throttling/cache, EDINET identity/XBRL/ZIP/corrections and FREE default routing.

live-free.cjs calls the real Pages handler with the real providers from the browser; no mock or snapshot fallback. It records each symbol PASS or BLOCKED separately. free-snapshot.cjs is explicitly offline official-snapshot validation and cannot establish live connectivity or acceptance. A previously downloaded official NVDA Companyfacts snapshot normalized successfully, including five annual periods and FCF; this is not a current SEC live E2E.

The earlier protected homepage, Indicator, Framework, Manifesto, Broker pages, shared styles/header/footer, package/config and deployed site remain unchanged. Browser regression covers ten routes and four widths. Existing published Framework 768px and Manifesto 1280px overflow values remain baseline exceptions; no new stock-page overflow or browser runtime errors were observed.

Live connection and acceptance results are recorded separately in TUTTO_STOCK_ANALYSIS_FREE_DATA_LOCAL_AUDIT.md. FREE MVP is not declared complete until both 7203 and NVDA satisfy actual financial data → shared engine → browser.
