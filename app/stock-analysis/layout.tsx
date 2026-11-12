import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { ResearchDisclaimer } from "@/components/stock-analysis/StockUI";
export default function StockAnalysisLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumb items={[{ name: "TUTTO 株式分析", path: "/stock-analysis/watchlist/" }]} />
    <div className="container-page pb-16 pt-6 sm:pb-24">
      <nav aria-label="株式分析メニュー" className="mb-6 flex flex-wrap gap-2 text-sm sm:mb-8 sm:gap-3">
        {[["/stock-analysis/watchlist/#daily-analysis-heading", "毎日の株式分析"]].map(([href, label]) =>
          <Link key={href} href={href} className="stock-nav">{label}</Link>)}
      </nav>
      {children}
      <ResearchDisclaimer />
    </div>
  </>;
}
