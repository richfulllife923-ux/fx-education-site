import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { ResearchDisclaimer } from "@/components/stock-analysis/StockUI";
export default function StockAnalysisLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumb items={[{ name: "TUTTO 株式分析", path: "/stock-analysis/" }]} />
    <div className="container-page pb-16 pt-6 sm:pb-24">
      <nav aria-label="株式分析メニュー" className="mb-6 flex flex-wrap gap-2 text-sm sm:mb-8 sm:gap-3">
        {[["/stock-analysis/", "株式分析トップ"], ["/stock-analysis/#stock-input", "銘柄を入力して分析"], ["/stock-analysis/watchlist/", "TUTTO 注目3銘柄"]].map(([href, label]) =>
          <Link key={href} href={href} className="stock-nav">{label} <span aria-hidden="true">→</span></Link>)}
      </nav>
      {children}
      <ResearchDisclaimer />
    </div>
  </>;
}
