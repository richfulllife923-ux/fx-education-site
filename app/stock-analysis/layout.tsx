import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { ResearchDisclaimer } from "@/components/stock-analysis/StockUI";

export default function StockAnalysisLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumb items={[{ name: "TUTTO 市場分析", path: "/stock-analysis/watchlist/" }]} />
    <div className="container-page pb-16 pt-6 sm:pb-24">
      <nav aria-label="市場分析メニュー" className="mb-6 flex flex-wrap gap-2 text-sm sm:mb-8 sm:gap-3">
        <Link href="/stock-analysis/watchlist/#daily-analysis-heading" className="stock-nav">毎日の市場分析</Link>
      </nav>
      {children}
      <ResearchDisclaimer />
    </div>
  </>;
}
