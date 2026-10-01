# TUTTO Research Status R1–R10 implementation

2026-10-01 / local implementation; commit, push and deployment are not authorized.

## Authority and cost boundary

Research Status authority: TUTTO_RESEARCH_STATUS_CONSTITUTION_R1-R10_2026-10-01.md.
Constitution version: R1-R10/2026-10-01.
SHA-256: 5cf99f28eb12d1f0f7c274f7799b62d17d28d79a83030f19c39971645a51b060.
Analysis implementation version: research-status/1.

The Current Investment Master, Emerging Growth module and InvestmentModules were read. Archive is not used.
The authority files remain in Obsidian; production does not read local vault paths.
No OpenAI, File Search, vector store, external LLM, paid provider or new dependency is added.
The legacy provider code is preserved but the Japan FREE publication gate remains in force. SEC requests are not resumed.

## Data boundary

Existing EDINET provider -> unchanged CompanyData -> unchanged Calculation Engine -> unchanged buildReport.
AnalysisService appends researchStatus separately, then the existing API exposes it alongside the exact report.
researchInput observes canonical identity, annual period, filing, Debt, OCF and existing FCF calculation.
Financial values, source fields, Evidence, annual selection and parser are not modified.

Availability and research condition truth are separate:
- AVAILABLE / MISSING / UNVERIFIED tracks input availability.
- MET / NOT_MET / UNVERIFIED tracks a formally assessed condition.
- MET requires a reason and traceable evidence references.
- Numeric zero is available data. Missing data is never zero, false, safe or good.
- Existing narrative templates, positive CF and successful retrieval do not attest Business, CF quality, Risk clearance or fair Valuation.
- The public request cannot supply or override research conditions or status.

## Formal aggregation

| Rule | Implementation |
| --- | --- |
| R1 | GREEN only after all required formal conditions and required data are confirmed; no missing Valuation exception. |
| R2 | Non-blocking unmet/unverified required conditions produce STAY. |
| R3 | Provider error, unresolved identity, absent latest formal annual or absent primary filing block with GRAY. General major financial deficiency requires an explicit formal severity assessment. |
| R4 | Missing/LIMITED Valuation or unfulfilled Valuation condition produces STAY after higher-priority GRAY gates. |
| R5 | Both OCF and FCF are required for GREEN. Explicitly major missing CF produces GRAY. Missing severity that is not formally determined remains pending and is reported for Owner Decision. |
| R6 | Missing Debt produces GRAY. No inferred industry exemption. |
| R7 | Explicit unresolved Major Risk / major Counter-Thesis produces GRAY. Ordinary inference warnings are not promoted to Major Risk. Unknown Risk is not clearance. |
| R8 | Formal Growth gate applies only in EMERGING mode. Standard mode is not blocked merely by weak Growth. |
| R9 | Existing Research State passes through unchanged when present; no one-to-one mapping or invented state. |
| R10 | Provider/integrity -> Major Risk -> Debt/CF -> Valuation -> Emerging Growth -> other formal requirements -> GREEN. Reasons and nextChecks prioritize blockers. |

Every result preserves passedReasons, pendingReasons, blockingReasons, nextChecks, dataCompleteness, fiscal date, version, constitution SHA and ruleTrace.
No weighted score or buy/sell advice is produced.

## Items stopped pending Owner Decision

The Constitution completes aggregation. It does not supply all underlying condition truth criteria.
Production therefore does not attest MET for qualitative Business, Financial quality, CF sustainability, Balance Sheet quality, Risk, Counter-Thesis, Valuation or Emerging Growth conditions.
The missing criteria are retained in ownerDecisionsRequired and displayed inside the audit disclosure.

Remaining items:
- Required Business Evidence and understandability criteria.
- Financial/Balance Sheet quality, and the general major-deficiency definition.
- CF sustainability and missing-CF severity.
- Major Risk / major counter-evidence severity and resolution criteria.
- Valuation model, assumptions, uncertainty-dependent safety margin and eligibility.
- Item-specific freshness and revalidation criteria.
- Emerging Growth durability and inflection conditions.

No unapproved growth percentage, positive-FCF threshold, Debt ratio, PER or ROE threshold is invented.
GREEN is implemented in the aggregator and verified with isolated TEST DATA attestations. Live reports cannot become GREEN merely because their financial values were retrieved.

## Presentation

Company/ticker -> Research Status -> at most five current-annual key numbers -> detailed analysis.
Individual search remains accessible through “別の銘柄を分析する”.
Compare shows independent company statuses without winner/ranking. Watchlist remains empty without registrations; only configured symbols become cards.
EMERGING mode uses the existing emerging API endpoint and applies R8 explicitly.

JPY numbers use compact 億円/兆円 display. Exact amounts and prior periods remain in “詳細データを見る →”.
Raw kinds, confidence, timestamps, field/formula paths, document IDs and source metadata are collapsed.
EDINET links go to the human browsing homepage. ZIP and WZEK0040 download links are not public anchors.
Backend ZIP fetching is unchanged. Financial DTOs are unchanged apart from an optional independent researchStatus property in public response types.

## Verification

Unit/contract tests use explicit TEST DATA only and never serve production fixtures.
Live EDINET tests independently require 7203 and 285A FY2026 and exercise JSON API, browser rendering, disclosures, source links, compare, watchlist and emerging.
The browser harness blocks all SEC and non-EDINET server requests, and all non-local browser navigation requests.
Both live companies currently have unavailable total interest-bearing Debt: R6 yields GRAY, overriding LIMITED Valuation's STAY.
Their exact financial values and FY2026 remain intact.
