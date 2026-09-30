import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { StockHero } from "@/components/stock-analysis/StockUI";
import CompareClient from "@/components/stock-analysis/CompareClient";
export const metadata = buildMetadata({ title: "銘柄比較", description: "2社の事業、業績、成長、Cash Flow、財務、Valuation、Riskを同じ基準で比較。", path: "/stock-analysis/compare/" });
export default function ComparePage() {
  return <><StockHero title="銘柄比較" english="Compare Stocks" description="同じテーマでも、需要の伝わり方やバリューチェーン上の位置は異なります。事業から現在価格まで、同じ基準で2社を比較します。" />
    <Suspense fallback={<p role="status">比較入力を読み込んでいます…</p>}><CompareClient /></Suspense>
    <p className="mt-8 text-sm leading-8 text-text-secondary">AI需要 → 売上 → 利益率 → Cash Flow → 持続性 → 現在価格。数値は一次資料の確認後に表示します。</p>
  </>;
}
