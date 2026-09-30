import { buildMetadata } from "@/lib/seo";
import SectionHeading from "@/components/SectionHeading";
import StockSearch from "@/components/stock-analysis/StockSearch";
import { StockHero, StockLink } from "@/components/stock-analysis/StockUI";
export const metadata = buildMetadata({ title: "TUTTO 株式分析", description: "事業、業績、Cash Flow、成長性、財務、Valuation、Riskから企業の現在地を観察する教育・研究情報。", path: "/stock-analysis/" });
export default function StockAnalysisPage() {
  return <>
    <StockHero title="TUTTO 株式分析" english="TUTTO Stock Analysis" description="企業を「上がる / 下がる」だけで見るのではなく、事業、売上、利益、Cash Flow、成長性、財務、Valuation、Riskを整理し、企業の現在地を観察します。" />
    <StockSearch />
    <section className="mt-12">
      <SectionHeading eyebrow="Research / Education" title="企業を知る、変化を見つける" description="一次資料を優先し、事実・計算・推論を分けて整理します。確認できない情報を推測で埋めません。" />
      <div className="grid gap-5 md:grid-cols-2">
        {[
          ["#stock-input", "銘柄を入力して分析", "会社名・証券コード・Tickerから、企業の事業と分析項目を確認します。", "銘柄を入力して分析"],
          ["/stock-analysis/watchlist/", "TUTTO 注目銘柄", "現在TUTTOが研究対象として注目している企業を整理します。", "注目銘柄を見る"],
          ["/stock-analysis/emerging-growth/", "成長企業発掘", "まだ広く認知されていない企業の売上、利益、Cash Flow、市場シェアの変化を研究します。", "成長企業を探す"],
          ["/stock-analysis/compare/", "銘柄比較", "事業、成長性、利益率、Cash Flow、財務、Valuation、Riskを同じ基準で比較します。", "銘柄を比較する"],
        ].map(([href, title, description, cta]) => <article key={href} className="card flex min-w-0 flex-col p-5 sm:p-6">
          <h2 className="text-xl font-bold">{title}</h2><p className="mb-6 mt-3 text-sm leading-7 text-text-secondary">{description}</p>
          <div className="mt-auto"><StockLink href={href}>{cta}</StockLink></div>
        </article>)}
      </div>
    </section>
    <p className="mt-8 text-sm leading-8 text-text-secondary">事業 → 売上 → 利益 → Cash Flow → 成長性 → 財務 → Valuation → Risk → Future Monitor</p>
  </>;
}
