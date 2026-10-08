import WatchlistRedirect from "@/components/stock-analysis/WatchlistRedirect";
import { buildMetadata } from "@/lib/seo";
export const metadata = {
  ...buildMetadata({ title: "TUTTO 注目5銘柄", description: "TUTTOがEvidenceから継続観測している成長候補を確認できます。", path: "/stock-analysis/watchlist/" }),
  robots: { index: false, follow: true },
};
export default function EmergingGrowthPage() { return <WatchlistRedirect />; }
