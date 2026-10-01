# EDINET Debt integration — Owner D1–D3

2026-10-01 / local implementation, no commit, push or deployment.

Authority: Current Obsidian `TUTTO_OBSIDIAN_DEBT_DEFINITION_CONSTITUTION_D1-D3_2026-10-01.md`.
SHA-256: 75C9AB3ADF737BF8EC6CE3EF2D39B93518FA1F302BA2FA41E36D63523B832D49.
Research Status R1–R10, including R6, is unchanged.

## Source and data boundary

Existing EDINET ZIP fetching and annual selection remain unchanged. `normalizeEdinetXbrl` collects the six reviewed Debt concepts in addition to its previous whitelist, then invokes `applyEdinetDebt` for the source filing's formal annual end.

The D1–D3 implementation is reviewed for issuers E02144 / E35948. New concepts are eligibility, not automatic adoption. No provider, dependency, LLM or paid API is added. US requests remain disabled.

Facts must have the current fiscal-end instant, correct consolidated issuer context, no unwanted dimensions, official financial namespace, JPY and a finite exactly representable integer amount. Duration values, nonconsolidated values, stale-year values, wrong currency and duplicate component facts are not substituted.

Only reviewed TextBlock names are read. The note namespace must be official or the issuer's matching annual extension namespace. Annual-duration notes must match the filing's start/end and issuer; supplemental management text must match the issuer and filing date.

## Toyota — D1 / D2 / D3

Primary Debt is an explicit structured formal total when available, otherwise the exact `有利子負債合計` row of the reviewed interest-bearing-liabilities note.

The table contract requires an explicit 百万円 unit, an unambiguous target fiscal-date column, and exactly one matching formal row. Bounded row/column expansion handles colspan / rowspan. Free prose-number extraction is not used. Unsupported or ambiguous formats remain UNVERIFIED.

Current and noncurrent standard facts validate the source-declared total. They do not define or replace it. Missing or conflicting validation cannot silently replace the total with a sum.

Lease is already included in the declared source total and is never added again. Financial / automotive current and noncurrent debt are supplemental data from the reviewed management balance-sheet table. They are not summed into consolidated Debt and do not override it; eliminations are respected.

FY2026:

- Source-declared primary: 43,205,469,000,000 JPY.
- Current: 17,581,104,000,000 JPY.
- Noncurrent: 25,624,365,000,000 JPY.
- Source type: SOURCE_DECLARED_TOTAL.
- Scope: CONSOLIDATED.

## Kioxia — validated components

The Borrowings and Other Financial Liabilities total is never used blindly as Debt. Separate current/noncurrent bonds and borrowings and current/noncurrent lease liabilities must agree with the four distinct rows of the current consolidated balance sheet.

The reviewed borrowing note must state that the sale-and-leaseback transactions fail the IFRS sale requirement and the funding is recognized as long-term borrowings. The lease note must state that the same transactions are not recognized as a sale/lease and refer to the borrowing note. Explicit contradictory overlap statements block adoption.

These documentary checks establish that recognized borrowings and recognized lease liabilities are separate categories. Sale-and-leaseback funding already included in borrowings is not a fifth component. Unpaid interest, derivatives and other financial liabilities are not added.

Only after those checks pass can the four approved components be calculated. If an exact source-declared formal total exists, D1 priority remains in force and it is cross-checked, not replaced by the sum.

FY2026 has no declared formal interest-bearing total in the reviewed source. It uses CALCULATED_FROM_COMPONENTS:

175,452,000,000 + 872,116,000,000 + 43,911,000,000 + 161,710,000,000 = 1,253,189,000,000 JPY.

All four source facts, documentary checks, formula, original value, source type and scope are retained. Missing or unconfirmed overlap proof produces null / UNVERIFIED, never a guessed number.

## Canonical compatibility and Research Status

`DebtDatum` extends the existing Datum with optional provenance fields for backwards compatibility. EDINET's reviewed debt output populates sourceType, sourceField, fiscalDate, currency, scope, confidence, components, checks, doubleCount, validation and supplemental data.

Current / noncurrent Debt use existing optional FinancialPeriod slots. Source facts outside Debt are unchanged. `netCash` automatically uses the now-available formal Debt with its existing formula; that expected derived-value change is retained in its trace.

Research Status adapter and pure engine are unchanged. Only validated primary Debt becomes AVAILABLE through their existing date/basis/currency/unit checks. Amount retrieval never asserts Risk CLEAR or GREEN. Valuation LIMITED and the unverified qualitative research conditions still apply.

## Presentation

Toyota primary is labelled 連結有利子負債. Kioxia calculated primary carries the small 構成要素から算出 description. Normal view stays compact; source types, formulas, current/noncurrent and supplemental sector debt are available inside 詳細データを見る.

Exact original amounts and proof metadata are preserved. Public anchors use the EDINET human browsing page. Backend ZIP fetching is unchanged.

## Tests

`tests/stock-analysis/edinet-debt.test.cjs` isolates TEST DATA and additionally replays saved official FY2026 XBRL when available. Negative cases include prohibited substitutions, total mismatch, ambiguous tables, missing units/date/context, missing components, wrong namespace/issuer/currency, duplicated facts and contradictory overlap.

The live Japan publication browser harness separately verifies EDINET values, source types, scope, all checks, R6 availability, STAY without Risk clearance, collapsed metadata and 375px rendering. Synthetic status UI cases are explicitly marked TEST DATA and are not live E2E evidence.