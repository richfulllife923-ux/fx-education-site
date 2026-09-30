"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { analysisSections, normalizeStockInput, stockAnalysisAdapter, type AnalysisResult } from "@/lib/stock-analysis";
import StockSearch from "./StockSearch";
import EvidenceView from "./EvidenceView";
import USMaintenanceNotice from "./USMaintenanceNotice";
import { isUsPrimaryUnavailable } from "@/lib/stock-analysis-status";
export function useStockReport(symbol:string) {
  const [result,setResult]=useState<AnalysisResult|null>(null);
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true;const controller=new AbortController();setResult(null);
    if(symbol && symbol.length<=100) stockAnalysisAdapter.analyze(symbol,controller.signal)
      .then(value=>{if(active)setResult(value);});
    return()=>{active=false;controller.abort();};
  },[symbol,attempt]);
  return {result,retry:()=>setAttempt(value=>value+1)};
}
export function ResultStatus({result,retry,onSelect}:{result:AnalysisResult|null;retry:()=>void;onSelect?:(symbol:string)=>void}) {
  if(isUsPrimaryUnavailable(result) && result?.status!=="ready")return <USMaintenanceNotice message={result!.message}/>;
  return <>
    <p className="mt-2 text-sm leading-7 text-text-secondary">{!result?"企業データを取得・照合しています…":result.status==="ready"?
      "分析日："+result.report.analyzedAt+" / "+result.report.symbol:result.message}</p>
    {result?.status==="ready" && result.report.metadata && <>
      <p className="mt-2 text-xs text-text-secondary">提供元：{result.report.metadata.provider}{result.report.metadata.mode==="FREE"?" / FREE MODE":""} / 更新日：{result.report.metadata.providerUpdatedAt??"未取得"} / 決算期：{result.report.metadata.fiscalDate??"未取得"} / 取得：{result.report.metadata.retrievedAt} / 株価時刻：{result.report.metadata.priceAsOf??"未取得"}</p>
      {result.report.metadata.issues.map((issue,index)=><p className="mt-2 text-sm text-amber-200" key={index}>{issue.code}：{issue.message}</p>)}
    </>}
    {result && result.status!=="ready" && <>
      <p className="mt-2 text-xs text-text-secondary">{result.code}</p>
      {result.candidates?.map(candidate=><button key={candidate.symbol} className="stock-nav mt-2 mr-2" onClick={()=>onSelect?.(candidate.symbol)}>
        {candidate.name} / {candidate.symbol} / {candidate.currency??"通貨未確認"}
      </button>)}
      {!result.candidates?.length && <button className="stock-nav mt-3" onClick={retry}>再試行</button>}
    </>}
  </>;
}
export default function AnalysisClient() {
  const params=useSearchParams(),router=useRouter();
  const symbol=normalizeStockInput(params.get("symbol")??""),valid=!!symbol && symbol.length<=100;
  const {result,retry}=useStockReport(valid?symbol:"");
  const usDisabled=isUsPrimaryUnavailable(result);
  return <>
    <StockSearch key={symbol} initialValue={symbol.slice(0,100)} />
    {!valid?<p className="mt-6" role="status">有効な銘柄名・証券コード・Tickerを入力してください。</p>:<>
      <div className="mt-8 card p-5 sm:p-6" role="status" aria-live="polite">
        <p className="break-words text-xl font-semibold">{result?.status==="ready"?result.report.companyName:"入力した銘柄："+symbol}</p>
        <ResultStatus result={result} retry={retry} onSelect={selected=>router.push("/stock-analysis/analyze/?"+new URLSearchParams({symbol:selected}))} />
        {!usDisabled && <p className="mt-2 text-xs text-text-secondary">{result?.status==="ready"?(result.report.metadata?.mode==="FREE"?"公式提出データのFACT、計算結果、推論、未確認事項を分けて表示しています。事業・注記の本文確認が必要です。":"提供元の集計データを表示しています。一次開示との個別照合は未実施です。"):"会社名・市場の確定には企業データの照合が必要です。"}</p>}
      </div>
      {!usDisabled && <div className="mt-6 grid gap-5 md:grid-cols-2">
        {analysisSections.map((section,index)=>{
          const evidence=result?.status==="ready"?result.report.sections[section.id]:undefined;
          return <section key={section.id} className="card min-w-0 p-5 sm:p-6">
            <p className="eyebrow text-emerald-400">SECTION {String(index+1).padStart(2,"0")}</p>
            <h2 className="text-xl font-bold">{section.title}</h2>
            {section.id==="scenarios" && <p className="mt-3 text-sm leading-7 text-text-secondary">Bull / Base / Bearは条件別Scenarioです。将来の株価や利益を保証しません。</p>}
            <ul className="mt-4 flex flex-wrap gap-2">{section.items.map(item=><li className="badge" key={item}>{item}</li>)}</ul>
            {evidence?.length?<dl className="mt-5 space-y-4">{evidence.map((item,index)=><EvidenceView item={item} key={index}/>)}</dl>:
              <p className="mt-5 text-sm leading-7 text-text-secondary">未取得 — 一次資料を確認してから表示します。</p>}
          </section>;
        })}
      </div>}
    </>}
  </>;
}
