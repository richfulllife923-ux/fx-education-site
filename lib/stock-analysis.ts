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
  label: string;
  value: string;
  kind: "FACT" | "CALCULATION" | "INFERENCE" | "UNKNOWN";
  sourceUrl: string;
  sourceTitle: string;
  asOf: string;
  period?: string;
  currency?: string;
  unit?: string;
};
export type StockReport = {
  companyName: string;
  symbol: string;
  analyzedAt: string;
  sections: Partial<Record<SectionId, Evidence[]>>;
};
export const watchlistCategories = ["AI", "Semiconductor", "Japan", "US", "Growth", "Value", "Cash Flow", "Turnaround"] as const;
export type WatchlistEntry = {
  companyName: string;
  symbol: string;
  categories: (typeof watchlistCategories)[number][];
  researchReason: string;
  sourceUrl: string;
  asOf: string;
};
export type AnalysisResult =
  | { status: "ready"; report: StockReport }
  | { status: "unavailable" | "not-found" | "error"; message: string };

/** A provider must resolve company names/codes with market disambiguation,
 * return sourced, dated DTOs, and keep all credentials on a server.
 * Static-export frontend ships with this explicitly unconfigured adapter.
 */
export interface StockAnalysisAdapter {
  analyze(input: string): Promise<AnalysisResult>;
  watchlist(): Promise<WatchlistEntry[]>;
}
export const stockAnalysisAdapter: StockAnalysisAdapter = {
  async analyze() {
    return { status: "unavailable", message: "企業データの取得・分析サービスは準備中です。入力した銘柄について、株価・財務数値・分析結果はまだ取得していません。" };
  },
  async watchlist() { return []; },
};
export function normalizeStockInput(value: string): string {
  return value.normalize("NFKC").trim();
}
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
