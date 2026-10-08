"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StockLink } from "./StockUI";
export default function WatchlistRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/stock-analysis/watchlist/"); }, [router]);
  return <div className="text-sm leading-7">
    <p className="mb-4 text-text-secondary" role="status">TUTTO 注目5銘柄へ移動します。</p>
    <StockLink href="/stock-analysis/watchlist/">TUTTO 注目5銘柄を見る</StockLink>
  </div>;
}
