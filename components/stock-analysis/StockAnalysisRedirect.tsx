"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {StockLink} from "./StockUI";
export default function StockAnalysisRedirect() {
  const router=useRouter();
  useEffect(()=>{router.replace("/stock-analysis/");},[router]);
  return <div className="text-sm leading-7"><p role="status" className="mb-4 text-text-secondary">株式分析トップへ移動します。</p>
    <StockLink href="/stock-analysis/">株式分析トップを見る</StockLink>
  </div>;
}
