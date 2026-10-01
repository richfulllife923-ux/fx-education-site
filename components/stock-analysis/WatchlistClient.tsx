"use client";
import { useEffect,useState } from "react";
import { stockAnalysisAdapter,type WatchlistResult } from "@/lib/stock-analysis";
import { StockLink } from "./StockUI";
import { ResearchStatusCard } from "./ResearchStatusCard";
import USMaintenanceNotice from "./USMaintenanceNotice";
import { EvidenceList } from "./EvidenceView";
import { publicSourceUrl } from "@/lib/stock-analysis-presentation";
import { usPrimaryUnavailableCode } from "@/lib/stock-analysis-status";
export default function WatchlistClient() {
  const [result,setResult]=useState<WatchlistResult|null>(null),[attempt,setAttempt]=useState(0);
  useEffect(()=>{let active=true;const controller=new AbortController();
    stockAnalysisAdapter.watchlist(controller.signal).then(value=>{if(active)setResult(value);});
    return()=>{active=false;controller.abort();};},[attempt]);
  if(result?.status==="ready" && (result.entries.length || result.issues.some(issue=>issue.code===usPrimaryUnavailableCode))) return <>
    {result.issues.filter(issue=>issue.code!==usPrimaryUnavailableCode).map((issue,index)=><article className="card mb-4 min-w-0 p-5" role="status" key={index}><p>{issue.symbol}</p>{issue.researchStatus && <ResearchStatusCard value={issue.researchStatus} compact/>}<p className="mt-3 text-sm text-amber-200">{issue.message}</p></article>)}
    {result.issues.filter(issue=>issue.code===usPrimaryUnavailableCode).map((issue,index)=><article className="card mb-5 p-6" key={index}><h2 className="text-xl font-bold">{issue.symbol??"米国株"}</h2>{issue.researchStatus && <ResearchStatusCard value={issue.researchStatus} compact/>}<USMaintenanceNotice message={issue.message}/></article>)}
    <div className="grid gap-5 md:grid-cols-2">{result.entries.map(entry=><article key={entry.symbol} className="card p-6">
      <h2 className="text-xl font-bold">{entry.companyName}</h2><p className="mt-2 text-sm">{entry.symbol} / {entry.categories.join(" / ")}</p>
      {entry.researchStatus && <ResearchStatusCard value={entry.researchStatus} compact/>}
      <p className="my-4 text-sm leading-7 text-text-secondary">{entry.researchReason}</p>
      <div className="my-4"><EvidenceList items={entry.evidence??[]} extraMetadata={entry}/></div>
      <p className="mt-3 text-sm leading-7 text-text-secondary">Risk / Counter-thesis：{entry.risk}</p>
      <p className="mt-3 text-sm leading-7 text-text-secondary">Next confirmation：{entry.nextConfirmation}</p>

      {publicSourceUrl(entry.sourceUrl) && <a className="stock-nav mb-4" href={publicSourceUrl(entry.sourceUrl)!} target="_blank" rel="noopener noreferrer">研究資料の入口 →</a>}
      <StockLink href={"/stock-analysis/analyze/?"+new URLSearchParams({symbol:entry.symbol})}>個別分析を見る</StockLink>
    </article>)}</div>
  </>;
  return <section className="card p-6 sm:p-8"><h2 className="text-xl font-bold">公開できる研究対象を準備中です</h2>
    <p className="mt-3 text-sm leading-7 text-text-secondary" role="status">{!result?"研究対象の取得状況を確認しています…":result.status!=="ready"?result.message:"管理者による研究対象の登録がありません。架空の銘柄リストは表示しません。"}</p>
    {result?.status==="ready" && result.issues.map((issue,index)=><p className="mt-3 text-sm text-amber-200" key={index}>{issue.message}</p>)}
    {result && result.status!=="ready" && <button className="stock-nav mt-3" onClick={()=>setAttempt(value=>value+1)}>再試行</button>}
    <div className="mt-5"><StockLink href="/stock-analysis/#stock-input">銘柄を入力して分析</StockLink></div>
  </section>;
}
