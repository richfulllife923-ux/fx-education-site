# TUTTO Stock Analysis Backend Architecture
Date: 2026-10-01 JST. Baseline: main / 9654190a528930f7a820762ac6e464217b55c775.
Status: local implementation; owner commercial entitlement and secrets required; NOT deployed.

## Decision
Keep Next static export, trailing slashes, existing routes and public UI. Add root-level Cloudflare Pages Functions under functions/api/stock-analysis/[[path]].ts. The existing Git build remains npm run build with out as static output. Functions are compiled by Cloudflare separately; they do not belong inside out. This follows [Cloudflare Functions setup](https://developers.cloudflare.com/pages/functions/get-started/) and [routing](https://developers.cloudflare.com/pages/functions/routing/). Actual project runtime deployment is unverified in this task.

Flow: existing browser forms → same-origin JSON API → verified symbol resolution → StockProvider adapter → canonical CompanyData → deterministic calculations/research templates → public Evidence DTO. Provider payloads and credentials never reach the client. No SSR migration, database, vector store, external LLM, subscriptions or new npm dependencies.

## Provider evaluation (official documentation, checked 2026-10-01)
| Provider | Japan/US and data | Price/rate snapshot | Public-site decision |
|---|---|---|---|
| EODHD | Global search, fundamentals, cash flows, indicative price and earnings calendar in one adapter. US AAPL v1.1 data actually verified. TSE search mapping implemented; exact 7203/285A entitlement, coverage, currency and update quality require owner-key validation. Non-US fields can be missing. | Personal fundamentals $59.99/month; all-in-one $99.99/month. Paid standard quota 100,000 weighted calls/day and 1,000 requests/minute; fundamentals consumes 10 weighted calls. These are not commercial display quotes. | Conditional implementation choice; owner must obtain written commercial JP/US public-display rights and caching permission before activation. No contract was purchased. |
| FMP | Global coverage on higher plans; stable profiles, search, statements, cash flow, quote/earnings APIs. Japanese ticker support and actual field availability still need entitlement testing. | Free 250/day; personal Starter $19, Premium $49, Ultimate $99/month with annual billing shown. Plan limits differ. | Separate Data Display Licensing Agreement required. A personal Ultimate plan is insufficient approval for publication. |
| Twelve Data | Business client-facing use and broad quote/financial interfaces; actual JP fundamentals entitlement is plan/exchange dependent and not validated. | Business Venture $499 monthly/$414 equivalent annually; Enterprise $1,099/$916; business/exchange terms vary. | Appropriate business contract and exchange permissions required; higher entry cost and coverage uncertainty for this scope. |

Sources: [EODHD fundamentals](https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds), [pricing](https://eodhd.com/pricing), [commercial pricing](https://eodhd.com/commercial-pricing), [commercial vs personal](https://eodhd.com/financial-apis/commercial-vs-personal-license-use), [terms](https://eodhd.com/financial-apis/terms-conditions); [FMP pricing/licensing](https://site.financialmodelingprep.com/developer/docs/pricing) and [API](https://site.financialmodelingprep.com/developer/docs/quickstart); [Twelve business pricing](https://twelvedata.com/pricing-business) and [commercial use](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage).
Prices are comparison evidence, not owner-approved procurement. Commercial EODHD pricing is a custom quote. Provider/feed reliability and Japanese completeness are not established by a US demo.

## Runtime/API
- POST /api/stock-analysis/analyze with {"input":"7203"}.
- POST /api/stock-analysis/emerging with the same body; returns the same complete evidence model.
- POST /api/stock-analysis/compare with {"a":"7203","b":"NVDA"}; both use the same engine and produce currency/fiscal-date/missing-data warnings.
- GET /api/stock-analysis/watchlist; only explicitly configured research inputs, maximum four, two concurrent analyses. Empty without owner entries.
- Body limited to 1 KB; stock input 1–100 NFKC characters; normalized case/spacing. Only approved endpoint/method and same-origin browser access.
- Structured errors: SYMBOL_NOT_FOUND, AMBIGUOUS_SYMBOL, DATA_PROVIDER_ERROR, RATE_LIMITED, FINANCIALS_UNAVAILABLE, VALUATION_UNAVAILABLE, EARNINGS_UNAVAILABLE, PARTIAL_DATA, CONFIGURATION_REQUIRED, INVALID_INPUT.
- Ambiguous symbols return candidates for explicit selection. No popularity-ranked first choice. Numeric codes are searched in both markets. Known company aliases also verify the candidate name. .T is mapped to verified .TSE. Only US/TSE Common Stock in this initial adapter; other markets/ETFs/unsupported securities are not silently guessed.
- No retries against the provider that could multiply costs; visible user retry. Independent fundamentals/quote/calendar calls run concurrently, each with a 12-second abort. Browser aborts obsolete requests and has a 65-second timeout.
- Primary source/issuer websites are research entry points, not claims of reviewed filings.

## Canonical model and calculations
Candidate identifies code, market, name, country, trading currency. CompanyData contains separate annual (up to five) and quarterly (up to eight) FinancialPeriods; each numeric Datum includes nullable value plus Source provider, URL, exact field path, basis, fiscal date, filing date, currency, unit, provider timestamp and original retrieval timestamp.

No missing-to-zero coercion, annualization of partial years, automatic FX conversion, arbitrary TTM sum or historical-share market cap approximation. Annual growth only uses comparable consecutive fiscal dates and positive prior values. Profit growth around losses is held for review. FCF uses OCF − total CapEx with outflow sign normalized; maintenance CapEx is unavailable. Margins, CF conversion and net cash retain formula/input traces and enforce period/currency compatibility.

P/E, P/B, EV/EBITDA and P/S are provider SOURCE CLAIM values with unresolved period/input details explicitly labeled. Loss/unknown TTM EPS invalidates P/E; nonpositive equity invalidates P/B. Market cap currency/share date and TTM EBITDA currency are not assumed. EV uses available reporting currency. FCF yield is deliberately withheld until all required denominator/input conditions are verified. [Provider field glossary](https://eodhd.medium.com/fundamentals-glossary-common-stock-bbdd45a01e58) is secondary to issuer filings, and its definitions do not fully establish market-cap currency.

## Cache, cost and failure boundaries
Default: no cross-request data cache; simultaneous identical requests are coalesced within the provider context. Commercial cache permission enables only transient per-isolate memory: quote 30s; search 10min; fundamentals 6h; earnings 1h. Original source/quote/filing/retrieval times survive cache reads. Maximum 32 records and 8 MB estimated cached JSON per provider context; at most two key-separated contexts. No durable raw financial store and no cache key containing the API token.

Responses are no-store. Failed/partial individual provider requests are not cached as successful data. Provider responses are bounded to 8 MB. Provider concurrency is bounded to 12, and new outbound requests to 120/minute per context. Public requests have a hashed-IP transient 12/minute per-isolate limiter. An optional distributed rate-limiter interface is supported, but no real binding was configured or validated.

Per-isolate limits are not a global quota guarantee: owner must verify Cloudflare project/WAF rate controls, provider quotas and operational budget before any future public launch. There is no account-level billing promise. Provider 429 is visible and does not trigger automatic retry storms.

## Security and owner setup
[Cloudflare environment/secrets guidance](https://developers.cloudflare.com/pages/functions/bindings/) supports server-side bindings. Set EODHD_API_KEY as a secret in the fx-education-site Pages project, in the intended environment. Never use NEXT_PUBLIC_*, source files, browser storage, chat messages, screenshots or commit files for keys.

After written commercial public-display permission is verified, set EODHD_PUBLIC_DISPLAY_APPROVED=true. Otherwise the API returns 503 CONFIGURATION_REQUIRED before any upstream request. Optionally set EODHD_CACHE_APPROVED=true only if permitted by that contract. TUTTO_WATCHLIST_SYMBOLS is an optional comma-separated owner research list. .env.example contains no key; local Wrangler uses an ignored .dev.vars with the same server-only names, not a Next public variable.

No provider URL, response body or exception containing api_token is returned/logged. Constant upstream hostname, encoded input, redirect rejection, bounded bodies, sanitized public errors, text rendering, source URL protocol validation, no wildcard CORS, and hashed/transient IP rate keys are implemented. Tests confirm static client output contains no backend adapter, token parameter, fixtures or private test token. Backend remains outside Next client imports.

## Local verification and future owner validation
Existing commands: npm run typecheck; npm run build.
Tests: node --test tests/stock-analysis/backend.test.cjs.
Browser: node tests/stock-analysis/browser.test.cjs with installed Playwright (PLAYWRIGHT_MODULE can point to a local installation).
Read-only optional actual AAPL demo: STOCK_LIVE_DEMO_TEST=1 node tests/stock-analysis/live-demo.cjs. Demo key rewriting exists only in this test script. Production rejects demo keys and has no synthetic/demo fallback.

With an available Wrangler CLI, wrangler pages dev out runs the actual root Functions locally and reads ignored .dev.vars. No Wrangler/dependency installation or deploy was performed here. Local browser harness tests the exported site and real Pages handler using clearly labeled isolated TEST DATA; it is not a Cloudflare emulator or a live Japan/US credential test.

Next owner action: confirm JP/US display/caching entitlement; configure local/server secret outside chat; run actual resolution → fundamentals → engine → UI tests for 7203, トヨタ, NVDA and preferably 285A/AAPL; inspect issuer/source/currency/date alignment and Cloudflare binding/runtime behavior. Stop before commit/push/deploy until explicitly requested.
