import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { StockHero } from "@/components/stock-analysis/StockUI";
import AnalysisClient from "@/components/stock-analysis/AnalysisClient";
export const metadata = { ...buildMetadata({ title: "個別銘柄分析", description: "企業の事業・業績・成長・財務・リスクを一次資料から確認する分析項目。", path: "/stock-analysis/analyze/" }), robots: { index: false, follow: true } };
export default function AnalyzePage() {
  return <><StockHero title="個別銘柄分析" english="Analyze a Stock" description="企業の事業を理解し、利益がCashに変わっているか、成長が持続するかを確認します。" />
    <Suspense fallback={<p role="status">銘柄入力を読み込んでいます…</p>}><AnalysisClient /></Suspense>
  </>;
}
