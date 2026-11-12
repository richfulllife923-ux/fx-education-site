import FeaturedFiveClient from "@/components/stock-analysis/FeaturedFiveClient";
import { buildMetadata } from "@/lib/seo";

const description =
  "企業の業績・財務・成長性・企業価値・リスクを観測する、TUTTOの公開株式ランキングです。";

export const metadata = buildMetadata({
  title: "TUTTO 注目5銘柄",
  description,
  path: "/stock-analysis/watchlist/",
});

export default function WatchlistPage() {
  return <FeaturedFiveClient />;
}
