import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { ResearchDisclaimer } from "@/components/stock-analysis/StockUI";
export default function StockAnalysisLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumb items={[{ name: "TUTTO 株式分析", path: "/stock-analysis/" }]} />
    <div className="container-page pb-16 pt-6 sm:pb-24">
      <nav aria-label="株式分析メニュー" className="mb-8 flex flex-wrap gap-3 text-sm">
        {[["/stock-analysis/", "株式分析トップ"], ["/stock-analysis/#stock-input", "銘柄を入力して分析"], ["/stock-analysis/watchlist/", "TUTTO 注目銘柄"], ["/stock-analysis/emerging-growth/", "成長企業を探す"], ["/stock-analysis/compare/", "銘柄を比較する"]].map(([href, label]) =>
          <Link key={href} href={href} className="stock-nav">{label} <span aria-hidden="true">→</span></Link>)}
      </nav>
      {children}
      <ResearchDisclaimer />
    </div>
  </>;
}
