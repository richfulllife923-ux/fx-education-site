import type {CorrectionProvenance} from "../server/stock-analysis/model";
import type {ResearchEvidenceResult} from "../server/stock-analysis/research-evidence/model";
import type { DebtEvidence } from "./stock-debt";
import { unavailableResearchStatus } from "./research-status";
import type { ResearchStatusResult } from "./research-status";
/** Independent equity research DTOs. No Indicator dependencies or fabricated data. */
export const analysisSections = [
  { id: "company", title: "会社概要", items: ["Company Name", "Ticker / Code", "Market", "Sector", "Industry", "Business Summary"] },
  { id: "business", title: "この会社は何をしている？", items: ["製品・サービス", "顧客", "初心者にもわかる事業説明"] },
  { id: "revenue", title: "何で稼いでいる？", items: ["Main Business", "Revenue drivers", "Segment structure"] },
  { id: "performance", title: "業績", items: ["Revenue", "Operating Income", "Net Income", "Growth trend"] },
  { id: "cash-flow", title: "Cash Flow", items: ["Operating CF", "Investing CF", "Financing CF", "Free Cash Flow"] },
  { id: "finance", title: "財務", items: ["Cash", "Debt", "Equity", "Balance sheet strength"] },
  { id: "growth", title: "Growth", items: ["Revenue growth", "Profit growth", "Market growth", "Structural growth drivers"] },
  { id: "valuation", title: "Valuation", items: ["PER / P/E", "PBR", "EV/EBITDA", "FCF Yield"] },
  { id: "risk", title: "Risk", items: ["Business risk", "Competition", "Margin pressure", "Debt", "Regulation", "Cyclicality", "Customer concentration", "Technology change"] },
  { id: "scenarios", title: "Bull / Base / Bear", items: ["条件別Scenario", "成立条件", "反証・無効化条件"] },
  { id: "earnings", title: "Next Earnings Monitor", items: ["次回決算の確認項目", "仮説を強化・否定する条件"] },
  { id: "notes", title: "Research Notes", items: ["一次資料", "資料の日付・決算期・通貨・単位", "FACT / CALCULATION / INFERENCE / UNKNOWN"] },
] as const;

export type SectionId = (typeof analysisSections)[number]["id"];
export type Evidence = {
  correction?:CorrectionProvenance;
  label: string; value: string;
  debt?:DebtEvidence; debtRole?:"PRIMARY"|"BREAKDOWN"|"SUPPLEMENTAL";
  kind: "FACT" | "SOURCE CLAIM" | "CALCULATION" | "INFERENCE" | "UNKNOWN";
  sourceUrl: string; sourceTitle: string; asOf: string;
  period?: string; currency?: string; unit?: string; retrievedAt?: string;
  field?: string; filingDate?: string; formula?: string; relatedFields?: string[];
  confidence?: "CONFIRMED" | "SUPPORTED" | "MIXED" | "UNVERIFIED" | "CONTRADICTED";
  inputs?: { name:string; value:number|null; period:string|null; basis:string; currency:string|null; field:string; asOf:string|null; sourceUrl:string }[];
};
export type ReportIssue = { code:string; message:string; symbol?:string; researchStatus?:ResearchStatusResult };
export type StockReport = {
  companyName: string; symbol: string; analyzedAt: string; researchStatus?:ResearchStatusResult; researchEvidence?:ResearchEvidenceResult;
  sections: Partial<Record<SectionId, Evidence[]>>;
  metadata?: { provider:string; retrievedAt:string; providerUpdatedAt:string|null;
    fiscalDate:string|null; currency:string|null; priceAsOf:string|null; issues:ReportIssue[]; mode?:"FREE"|"COMMERCIAL"; valuationStatus?:"LIMITED"|"AVAILABLE" };
  emerging?: { observation:string; evidence:Evidence[]; missing:string[]; risks:Evidence[];
    classification:"UNVERIFIED"; nextConfirmation:string };
};
export const watchlistCategories = ["AI", "Semiconductor", "Japan", "US", "Growth", "Value", "Cash Flow", "Turnaround"] as const;
export type WatchlistEntry = {
  companyName:string; symbol:string; researchStatus?:ResearchStatusResult; categories:(typeof watchlistCategories)[number][];
  researchReason:string; sourceUrl:string; asOf:string; risk?:string; nextConfirmation?:string; evidence?:Evidence[];
};
export type AnalysisResult =
  | { status:"ready"; report:StockReport }
  | { status:"unavailable" | "not-found" | "error"; message:string; code?:string; retryable?:boolean;
      researchStatus?:ResearchStatusResult; candidates?:{symbol:string;name:string;exchange:string;currency:string|null}[] };
export type ComparisonResult = { status:"ready"; a:AnalysisResult; b:AnalysisResult; warnings:string[] } |
  { status:"error" | "unavailable"; message:string; code?:string; researchStatus?:ResearchStatusResult };
export type WatchlistResult = {status:"ready";entries:WatchlistEntry[];issues:ReportIssue[]} |
  {status:"unavailable"|"error";message:string;code?:string;researchStatus?:ResearchStatusResult};
export interface StockAnalysisAdapter {
  analyze(input:string,signal?:AbortSignal):Promise<AnalysisResult>;
  emerging(input:string,signal?:AbortSignal):Promise<AnalysisResult>;
  compare(a:string,b:string,signal?:AbortSignal):Promise<ComparisonResult>;
  watchlist(signal?:AbortSignal):Promise<WatchlistResult>;
}
async function api<T>(endpoint:string,body?:unknown,signal?:AbortSignal):Promise<T> {
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),65000);
  const abort=()=>controller.abort(); signal?.addEventListener("abort",abort,{once:true});
  if (signal?.aborted) controller.abort();
  try {
    const response=await fetch("/api/stock-analysis/"+endpoint,{
      method:body===undefined?"GET":"POST",headers:body===undefined?undefined:{"Content-Type":"application/json"},
      body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,cache:"no-store",
    });
    if (!response.headers.get("content-type")?.includes("application/json"))
      return {status:"unavailable",code:"CONFIGURATION_REQUIRED",researchStatus:["analyze","emerging"].includes(endpoint)?unavailableResearchStatus():undefined,message:"分析APIが未設定です。企業データは取得していません。管理者によるサーバー設定が必要です。"} as T;
    const result=await response.json() as Record<string,unknown>;
    if (!["ready","unavailable","not-found","error"].includes(String(result.status))) throw new Error("Invalid API response");
    const ready=result.status==="ready";
    if(ready && ["analyze","emerging"].includes(endpoint) && (!result.report || typeof result.report!=="object" ||
      typeof (result.report as Record<string,unknown>).symbol!=="string" ||
      !(result.report as Record<string,unknown>).sections)) throw new Error("Invalid report");
    if(ready && endpoint==="compare" && (!result.a || !result.b || !Array.isArray(result.warnings))) throw new Error("Invalid comparison");
    if(ready && endpoint==="watchlist" && (!Array.isArray(result.entries) || !Array.isArray(result.issues))) throw new Error("Invalid watchlist");
    return result as T;
  } catch {
    return {status:"error",code:"DATA_PROVIDER_ERROR",retryable:true,researchStatus:["analyze","emerging"].includes(endpoint)?unavailableResearchStatus():undefined,message:"データを取得できませんでした。接続を確認し、時間をおいて再試行してください。"} as T;
  } finally { clearTimeout(timeout); signal?.removeEventListener("abort",abort); }
}
export const stockAnalysisAdapter:StockAnalysisAdapter={
  analyze:(input,signal)=>api<AnalysisResult>("analyze",{input},signal),
  emerging:(input,signal)=>api<AnalysisResult>("emerging",{input},signal),
  compare:(a,b,signal)=>api<ComparisonResult>("compare",{a,b},signal),
  watchlist:signal=>api<WatchlistResult>("watchlist",undefined,signal),
};
export function normalizeStockInput(value:string):string { return value.normalize("NFKC").trim(); }

export const comparisonAxes = [
  ["Business", "製品・顧客・バリューチェーン上の位置"],
  ["Revenue", "収益源・セグメント・売上推移"],
  ["Growth", "構造成長と市況循環・成長の加速"],
  ["Margins", "利益率の質・競争優位"],
  ["Cash Flow", "営業CF・FCF・設備投資・運転資本"],
  ["Balance Sheet", "現金・負債・返済期限・希薄化"],
  ["Valuation", "同じ決算期・通貨・会計基準での評価"],
  ["Risk", "顧客集中・競争・規制・流動性"],
  ["Future Drivers", "成長条件・反証・次回決算の確認点"],
] as const;
