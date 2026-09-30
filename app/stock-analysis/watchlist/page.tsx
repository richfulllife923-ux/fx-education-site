import WatchlistClient from "@/components/stock-analysis/WatchlistClient";
import { buildMetadata } from "@/lib/seo";
import { watchlistCategories } from "@/lib/stock-analysis";
import { StockHero, StockLink } from "@/components/stock-analysis/StockUI";
export const metadata = buildMetadata({ title: "TUTTO 注目銘柄", description: "TUTTOが研究対象として注目している企業を整理するWatchlist。", path: "/stock-analysis/watchlist/" });
export default function WatchlistPage() {

  return <><StockHero title="TUTTO 注目銘柄" english="TUTTO Watchlist" description="現在TUTTOが研究対象として注目している企業を整理します。研究の理由、一次資料、確認日を添えて企業の変化を観察します。" />
    <ul aria-label="研究対象の分類" className="mb-6 flex flex-wrap gap-2">{watchlistCategories.map(category => <li className="badge" key={category}>{category}</li>)}</ul>
    <WatchlistClient />
  </>;
}
