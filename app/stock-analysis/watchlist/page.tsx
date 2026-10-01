import WatchlistClient from "@/components/stock-analysis/WatchlistClient";
import { buildMetadata } from "@/lib/seo";
const description = "TUTTOが公開情報・業績・Cash Flow・事業変化などのEvidenceから、現在継続観測している3銘柄です。";
export const metadata = buildMetadata({ title: "TUTTO 注目3銘柄", description, path: "/stock-analysis/watchlist/" });
export default function WatchlistPage() {
  return <>
    <header className="mb-5 max-w-3xl sm:mb-8">
      <p className="eyebrow">TUTTO WATCHLIST</p>
      <h1 className="text-3xl font-bold leading-tight sm:text-5xl">TUTTO 注目3銘柄</h1>
      <p className="mt-3 text-sm leading-7 text-text-secondary sm:text-[15px]">{description}</p>
    </header>
    <WatchlistClient />
  </>;
}
