import type { DebtEvidence } from "../../lib/stock-debt";
/** Canonical provider-independent model. null means unavailable, never zero. */
export type Basis = "annual" | "quarterly" | "half-year" | "TTM" | "instant";
export type Source = {
  provider: string; url: string; title: string; retrievedAt: string;
  asOf: string | null; field: string; basis: Basis; period: string | null;
  currency: string | null; unit: string; filingDate?: string | null; classification?:"FACT"|"SOURCE CLAIM"; start?:string|null; form?:string; accession?:string; contextRef?:string;
};
export type Datum = { value: number | null; source: Source };
export type DebtDatum = Datum & Partial<DebtEvidence>;
export type Candidate = {
  symbol: string; code: string; exchange: "US" | "TSE" | "JP"; name: string;
  country: string; currency: string | null; cik?:string; edinetCode?:string;
};
export type FinancialPeriod = {
  end: string; basis: "annual" | "quarterly" | "half-year"; currency: string | null;
  revenue: Datum; grossProfit: Datum; operatingIncome: Datum; netIncome: Datum;
  operatingCF: Datum; investingCF: Datum; financingCF: Datum; capex: Datum;
  cash: Datum; investments: Datum; debt: DebtDatum; equity: Datum; assets: Datum;
  receivables: Datum; inventory: Datum; shares: Datum; sbc: Datum; liabilities?:Datum; eps?:Datum; currentDebt?:Datum; noncurrentDebt?:Datum;
};
export type CompanyData = {
  provider?:"SEC"|"EDINET"|"EODHD"; mode?:"FREE"|"COMMERCIAL"; valuationStatus?:"LIMITED"|"AVAILABLE";
  primarySource?:Source; filings?:{url:string;title:string;filed:string;period:string|null;amended:boolean}[]; semiAnnual?:FinancialPeriod[];
  identity: Candidate; description: string | null; sector: string | null;
  industry: string | null; website: string | null; cik: string | null;
  updatedAt: string | null; retrievedAt: string;
  annual: FinancialPeriod[]; quarterly: FinancialPeriod[];
  quote: { price: Datum; previousClose: Datum; delayed: true } | null;
  valuation: { pe: Datum; pb: Datum; evEbitda: Datum; ps: Datum; epsTTM: Datum; marketCap: Datum; enterpriseValue: Datum; ebitdaTTM: Datum };
  earnings: { date: string; period: string | null; timing: string | null; source: Source }[];
  issues: Issue[];
};
export type ErrorCode = "US_PRIMARY_SOURCE_TEMPORARILY_UNAVAILABLE" | "SYMBOL_NOT_FOUND" | "AMBIGUOUS_SYMBOL" | "DATA_PROVIDER_ERROR" |
  "RATE_LIMITED" | "FINANCIALS_UNAVAILABLE" | "VALUATION_UNAVAILABLE" |
  "EARNINGS_UNAVAILABLE" | "PARTIAL_DATA" | "CONFIGURATION_REQUIRED" | "INVALID_INPUT";
export type Issue = { code: ErrorCode; message: string };
export class StockError extends Error {
  constructor(public code: ErrorCode, message: string, public candidates?: Candidate[]) {
    super(message); this.name = "StockError";
  }
}
export interface StockProvider {
  search(query: string,market?:Candidate["exchange"]): Promise<Candidate[]>;
  company(candidate: Candidate): Promise<CompanyData>;
}
export function numberOrNull(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function dateOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value ? value : null;
}
export function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0,12000) : null;
}
export function publicUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
