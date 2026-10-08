import WatchlistClient from "@/components/stock-analysis/WatchlistClient";
import { buildMetadata } from "@/lib/seo";
const description = "年次財務に基づく公開用観測評価。TUTTO 注目3銘柄とTUTTO 注目度。";
export const metadata = buildMetadata({ title: "TUTTO 注目3銘柄", description, path: "/stock-analysis/watchlist/" });
export default function WatchlistPage() {
 return <>
  <header className="mb-5 sm:mb-8"><h1 className="text-3xl font-bold leading-tight sm:text-5xl">TUTTO 注目3銘柄</h1><p className="mt-3 text-sm leading-7 text-text-secondary">TUTTO独自の計算 × 幾何学的評価から、その時点の注目3銘柄を算出。</p></header>
  <WatchlistClient />
 </>;
}
