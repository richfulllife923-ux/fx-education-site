# TUTTO Japan FREE MODE publication

Updated: 2026-10-01 JST. This publication phase supersedes earlier local-only restrictions when the Owner-authorized release checks pass. The separate CODEX_HANDOVER_2026-08-10.md is excluded from the commit and is not edited, moved, deleted or staged.

## Released behavior

The default mode is FREE. Japan company resolution uses the official EDINET issuer list, then live EDINET API v2 documents, existing XBRL normalization, canonical financial data, calculations and the existing 12-section report. Inputs 7203 / 7203.JP / トヨタ / Toyota and 285A / 285A.JP / キオクシア / Kioxia resolve directly to Japan without SEC lookups.

The latest annual guard remains unchanged: if the latest official annual document cannot provide the current fiscal period, an older fiscal year is not promoted as the latest report. The current verified Toyota/Kioxia fiscal end is 2026-03-31.

US live routing is closed by default. A US symbol, brand alias or US-like input with no matching Japanese issuer returns:
- HTTP 503 for analyze/emerging.
- status=unavailable.
- code=US_PRIMARY_SOURCE_TEMPORARILY_UNAVAILABLE.
- retryable=false, no report, no fixture/snapshot/fallback evidence.
- A maintenance explanation and a link to analyze a Japanese company.

Because SEC lookup is stopped, an unknown US-like input receives lookup-unavailable rather than an invented not-found verdict. Unknown explicit JP codes still return SYMBOL_NOT_FOUND.

Japan/Japan comparison stays active. Mixed comparison preserves the Japan result and shows the US-side suspension. US/US comparison returns per-side unavailable states rather than crashing the comparison response. Watchlist preserves administrator-selected US symbols as maintenance cards without manufacturing entries or evidence. Japan emerging observations use the same factual reports; US emerging requests stop before any SEC access.

Market-price valuation remains LIMITED. Missing fields are UNKNOWN, never zero. FCF is calculated only with compatible verified inputs. Stock price, paid provider and fabricated business descriptions are not required.

## Server configuration

Use the existing Cloudflare Pages project fx-education-site and its existing Git build (npm run build, static out, root Pages Functions). Do not create another hosting service or change the static-export framework.

Production settings:
- EDINET_API_KEY: server-side Secret, provisioned by Owner. Never NEXT_PUBLIC, source, Git, HTML, browser storage or logs.
- STOCK_DATA_MODE=FREE.
- SEC_LIVE_ENABLED=false.
- SEC_PUBLIC_RELEASE_APPROVED=false (safe default when missing).
- SEC_CONTACT_EMAIL: optional while US access is stopped; used only by the preserved SEC adapter after restoration.
- TUTTO_WATCHLIST_SYMBOLS: optional Owner-selected research symbols, max four; empty by default.
- EDINET_FILING_INDEX: optional existing KV binding; otherwise the bundled official metadata index is used.

The local ignored .dev.vars remains the local secret source. No secret value is included here.

Both SEC_LIVE_ENABLED=true and SEC_PUBLIC_RELEASE_APPROVED=true are required before the public API can activate US routing. Changing one flag does not activate the public US route. Session cache identity includes both flags, so a previously enabled session cannot remain active after disabling a flag.

The legacy EODHD adapter remains isolated for previously approved contracts and tests, but that mode cannot bypass the closed publication gate. FREE never falls back to that provider.

Cloudflare secret/settings confirmation is a prerequisite to pushing main because the existing Git integration can immediately deploy a push. If EDINET_API_KEY is unconfirmed, keep production deployment blocked. Config updates need a subsequent Pages deployment to become runtime bindings, according to Cloudflare's bindings documentation.

## Local acceptance evidence

- Local unit/contract tests: 89/89 PASS.
- TypeScript: PASS.
- Next production static build: PASS, 34 pages.
- Live browser publication audit: 26 cases PASS.
- Japan: eight requested forms resolve, live EDINET financial data, fiscalDate=2026-03-31, 12 sections, FACT/CALCULATION and LIMITED valuation.
- Toyota Revenue source: S100Y8NY. Kioxia Revenue source: S100YJ18.
- NVDA/NVIDIA/AAPL/Apple/MSFT/GOOGL: explicit unavailable, no report, no retry button.
- Unknown JP: proper not-found. Unknown US-like: proper suspended-lookup state.
- Japan/Japan, mixed Japan/US and US/US comparison: PASS.
- Mixed Watchlist and Japan/US emerging observations: PASS.
- SEC live requests during this phase's browser audit: zero. The harness traps and rejects any SEC request.
- Ten routes at 320/375/768/1280px: no new overflow, no browser runtime errors.
- Protected pre-existing overflow is reproduced without editing those pages: Framework at 768px has scrollWidth 832px; Manifesto at 1280px has scrollWidth 1312px. Stock Analysis pages have no horizontal overflow.
- Existing isolated TEST DATA browser regression: PASS. These are explicitly not live E2E and are never imported by deployed runtime code.
- Web API ESM function bundle: no Node-specific import, test import or new runtime dependency.
- Secret/contact exposure scan across source/client output: none.
- EDINET parser, ZIP/transport, latest-year selection, issuer/index data and SEC adapter: unchanged in this publication phase.
- Homepage: Hero / Broker Selection / Stock Analysis / Indicator after the Owner-requested removal of the duplicate Manifesto card. Hero Manifesto CTA, IMPORTANT NOTICE, Distribution, Indicator, Framework and Broker content: unchanged.

The ignored output directory records current live browser evidence and local audit details. Actual production availability is confirmed only by post-deployment smoke tests.

## SEC status and restoration

SEC_SENT=YES (Owner reported); SEC_REPLY_PENDING=YES; SEC_CONNECTED=NO. No new live SEC diagnostic is run in this publication phase. Inquiry details, public IP and 403 reference IDs are not displayed on the public site.

After SEC replies: review the response, perform a separately authorized local single-request diagnostic and NVDA/AAPL E2E, inspect preview, then obtain Owner release review. Only then enable both server flags for production and deploy. No automation flips these flags.

## Maintenance and release evidence

Keep the existing official issuer/filing index maintenance procedure. Current bundled contiguous submission coverage is 2025-06-01 through 2026-10-01. The provider rejects stale index coverage after its existing seven-day limit; do not substitute old financial snapshots.

The final release report records commit/push/deployment state separately from these local checks. Owner Cloudflare confirmation is required where dashboard/CLI inspection is unavailable; the report distinguishes Owner confirmation from independently observed runtime smoke tests.

Official references:
- [Cloudflare Pages Functions bindings and secrets](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [EDINET API v2 specification](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf)

## Cloudflare native fetch boundary

The first production smoke test returned DATA_PROVIDER_ERROR for Japan before a successful upstream response. Node tests tolerated a native fetch stored and invoked as a provider method, while native browser/Workers fetch rejects the provider instance as its receiver. A regression test reproduces that failure, and the Pages API now passes an arrow wrapper calling globalThis.fetch. EDINET parser, annual selection, transport implementation, rate limits, redirect rejection and the SEC gate remain unchanged. The wrapped form also succeeds with a real Chromium native fetch against an inline data URL, without external requests.

[Cloudflare illegal invocation guidance](https://developers.cloudflare.com/workers/observability/errors/#illegal-invocation-errors) describes the receiver constraint. Post-fix production smoke evidence is recorded separately; a local PASS alone does not establish production success.
The remaining immediate failure was reproduced in official workerd: redirect="error" is rejected before network I/O. The same single official EDINET request with redirect="manual" returned HTTP 200 / metadata.status=200. The API wrapper now translates the reject-redirect contract to manual mode and explicitly rejects all 3xx responses without following Location. This preserves the official-host and secret-forwarding boundary without changing PrimaryHttp or EDINET parsing/selection. A separate synthetic 302 regression verifies exactly one call and no redirected fetch. Runtime diagnostic evidence is kept in the ignored edinet-worker-runtime-probe.json.
The corrected Pages Functions also passed live EDINET E2E in official workerd (Wrangler 4.145.0, compatibility date 2026-09-01): 7203 and 285A HTTP 200 / FY2026 / 12 sections; NVDA and AAPL HTTP 503 / dedicated unavailable code. The temporary dev runtime/cache stays Git-ignored and adds no package dependency.
