"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { analysisSections, normalizeStockInput, stockAnalysisAdapter, type AnalysisResult } from "@/lib/stock-analysis";
import { fiscalPeriodLabel, publicSectionTitle, sectionPlaceholder } from "@/lib/stock-analysis-presentation";
import { ResearchStatusCard, KeyNumbers } from "./ResearchStatusCard";
import ResearchEvidenceCard from "./ResearchEvidenceCard";
import SummaryScoreCard from "./SummaryScoreCard";
import { summaryScoreForReport } from "@/lib/summary-score-report";
import StockSearch from "./StockSearch";
import { EvidenceList } from "./EvidenceView";
import USMaintenanceNotice from "./USMaintenanceNotice";
import { isUsPrimaryUnavailable } from "@/lib/stock-analysis-status";
export function useStockReport(symbol:string,mode:"STANDARD"|"EMERGING"="STANDARD") {
  const [result,setResult]=useState<AnalysisResult|null>(null);
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true;const controller=new AbortController();setResult(null);
    if(symbol && symbol.length<=100) stockAnalysisAdapter[mode==="EMERGING"?"emerging":"analyze"](symbol,controller.signal)
      .then(value=>{if(active)setResult(value);});
    return()=>{active=false;controller.abort();};
  },[symbol,attempt,mode]);
  return {result,retry:()=>setAttempt(value=>value+1)};
}
export function ResultStatus({result,retry,onSelect,keyNumbers=false,summaryScore=false}:{result:AnalysisResult|null;retry:()=>void;onSelect?:(symbol:string)=>void;keyNumbers?:boolean;summaryScore?:boolean}) {
  if(isUsPrimaryUnavailable(result) && result?.status!=="ready")return <>{result?.researchStatus && <ResearchStatusCard value={result.researchStatus}/>}<USMaintenanceNotice message={result!.message}/></>;
  if(result?.status==="ready"){
    const report=result.report,metadata=report.metadata;
    return <>
      <p className="mt-2 text-sm text-text-secondary">{report.symbol}</p>
      {summaryScore && <SummaryScoreCard value={summaryScoreForReport(report)} fiscalDate={metadata?.fiscalDate}/>}
      {report.researchStatus && <ResearchStatusCard value={report.researchStatus}/>}
      {keyNumbers && <KeyNumbers report={report}/>}
      {report.researchEvidence && <ResearchEvidenceCard value={report.researchEvidence}/>}
      <p className="mt-2 text-sm text-text-secondary">{fiscalPeriodLabel(metadata?.fiscalDate)} / {metadata?.provider??"出典未確認"}</p>
      {metadata?.issues.some(issue=>issue.code==="PARTIAL_DATA") && <p className="mt-2 text-sm text-text-secondary">一部の項目は未取得です。</p>}
      {metadata?.valuationStatus==="LIMITED" && <p className="mt-2 text-xs text-text-secondary">株価を使う評価指標は未取得です。</p>}
      <details className="mt-4 min-w-0 border-t border-border pt-3">
        <summary className="cursor-pointer text-sm text-blue-300">詳細データを見る →</summary>
        <dl className="mt-3 space-y-2 break-words text-xs leading-6">
          <div><dt>銘柄</dt><dd>{report.symbol}</dd></div>
          <div><dt>分析日</dt><dd>{report.analyzedAt}</dd></div>
          <div><dt>取得日</dt><dd>{metadata?.retrievedAt??"未取得"}</dd></div>
          <div><dt>資料更新日</dt><dd>{metadata?.providerUpdatedAt??"未取得"}</dd></div>
          <div><dt>対象決算期</dt><dd>{metadata?.fiscalDate??"未取得"}</dd></div>
          <div><dt>通貨</dt><dd>{metadata?.currency??"未確認"}</dd></div>
          <div><dt>株価の基準日時</dt><dd>{metadata?.priceAsOf??"未取得"}</dd></div>
        </dl>
        {metadata?.issues.map((issue,index)=><p className="mt-3 break-words text-xs leading-6 text-text-secondary" key={index}>{issue.code}：{issue.message}</p>)}
        <details className="mt-3"><summary className="cursor-pointer text-xs text-text-secondary">Source metadata</summary>
          <pre className="mt-2 max-w-full whitespace-pre-wrap break-all text-xs">{JSON.stringify(metadata??{},null,2)}</pre>
        </details>
      </details>
    </>;
  }
  return <>
    {result?.researchStatus && <ResearchStatusCard value={result.researchStatus}/>}
    <p className="mt-2 text-sm leading-7 text-text-secondary">{!result?"企業データを取得・照合しています…":result.message}</p>
    {result && <>
      {result.candidates?.map(candidate=><button key={candidate.symbol} className="stock-nav mt-2 mr-2" onClick={()=>onSelect?.(candidate.symbol)}>
        {candidate.name} / {candidate.symbol} / {candidate.currency??"通貨未確認"}
      </button>)}
      {!result.candidates?.length && <button className="stock-nav mt-3" onClick={retry}>再試行</button>}
      {result.code && <details className="mt-3"><summary className="cursor-pointer text-xs text-text-secondary">詳細データを見る →</summary><p className="mt-2 text-xs">{result.code}</p></details>}
    </>}
  </>;
}
export default function AnalysisClient() {
  const params=useSearchParams(),router=useRouter();
  const symbol=normalizeStockInput(params.get("symbol")??""),valid=!!symbol && symbol.length<=100;
  const {result,retry}=useStockReport(valid?symbol:"");
  const usDisabled=isUsPrimaryUnavailable(result);
  return <>
    {!valid && <StockSearch key={symbol} initialValue={symbol.slice(0,100)} />}
    {!valid?<p className="mt-6" role="status">有効な銘柄名・証券コード・Tickerを入力してください。</p>:<>
      <div className="mt-8 card p-5 sm:p-6" role="status" aria-live="polite">
        <p className="break-words text-xl font-semibold">{result?.status==="ready"?result.report.companyName:"入力した銘柄："+symbol}</p>
        <ResultStatus result={result} retry={retry} keyNumbers summaryScore onSelect={selected=>router.push("/stock-analysis/analyze/?"+new URLSearchParams({symbol:selected}))} />
        {!usDisabled && result?.status!=="ready" && <p className="mt-2 text-xs text-text-secondary">会社名・市場の確定には企業データの照合が必要です。</p>}
      </div>
      <details className="mt-5"><summary className="cursor-pointer text-sm text-blue-300">別の銘柄を分析する →</summary><div className="mt-3"><StockSearch key={symbol} initialValue={symbol.slice(0,100)}/></div></details>
      {result?.status==="ready" && <a className="stock-nav mt-6 inline-block" href="#detailed-analysis">詳しい分析を見る →</a>}
      {!usDisabled && <div id="detailed-analysis" className="mt-6 grid gap-5 md:grid-cols-2">
        {analysisSections.map((section,index)=>{
          const evidence=result?.status==="ready"?result.report.sections[section.id]:undefined;
          return <section key={section.id} className="card min-w-0 p-5 sm:p-6">
            <p className="eyebrow text-emerald-400">SECTION {String(index+1).padStart(2,"0")}</p>
            <h2 className="text-xl font-bold">{publicSectionTitle(section.id,section.title)}</h2>
            {section.id==="scenarios" && <p className="mt-3 text-sm leading-7 text-text-secondary">Bull / Base / Bearは条件別Scenarioです。将来の株価や利益を保証しません。</p>}
            {section.id==="notes" && <p className="mt-3 text-sm leading-7 text-text-secondary">出典と確認事項は詳細データで確認できます。公開資料をもとにTUTTOが整理・算定しています。</p>}
            {evidence?.length?<div className="mt-5"><EvidenceList items={evidence} focusPeriod={result?.status==="ready"?result.report.metadata?.fiscalDate:undefined} auditOnly={section.id==="notes"}/></div>:
              <p data-state={sectionPlaceholder(result).state} className="mt-5 text-sm leading-7 text-text-secondary">{sectionPlaceholder(result).label}</p>}
          </section>;
        })}
      </div>}
    </>}
  </>;
}
