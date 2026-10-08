"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {StockLink} from "./StockUI";
export default function StockAnalysisRedirect() {
  const router=useRouter();
  useEffect(()=>{router.replace("/stock-analysis/watchlist/");},[router]);
  return <div className="text-sm leading-7"><p role="status" className="mb-4 text-text-secondary">TUTTO 注目3銘柄へ移動します。</p>
    <StockLink href="/stock-analysis/watchlist/">TUTTO 注目3銘柄を見る</StockLink>
  </div>;
}
