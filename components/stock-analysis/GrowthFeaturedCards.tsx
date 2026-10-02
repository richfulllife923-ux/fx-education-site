import type {GrowthFeaturedCandidate} from "@/lib/growth-radar-public";
import {StockLink} from "./StockUI";
import {fiscalPeriodLabel,publicSourceUrl,publicLabel,publicValue} from "@/lib/stock-analysis-presentation";

/** Presentation only: card order and qualification are owned by the existing Top3 engine. */
export default function GrowthFeaturedCards({entries}:{entries:GrowthFeaturedCandidate[]}){
 return <div className="grid min-w-0 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
  {entries.map((entry,index)=>{
   const score=entry.summaryScore,coverage=score.coverage;
   return <article key={entry.symbol} data-featured-symbol={entry.symbol} className={"card min-w-0 rounded-2xl p-5 [overflow-wrap:anywhere] sm:p-6"+(index===0?" border-cyan-400/40":"")}>
    <p className="mb-2 text-lg font-bold text-cyan-300" aria-label={"表示順 "+(index+1)}>#{index+1}</p>
    <h2 className="text-xl font-bold">{entry.companyName}</h2>
    <p className="mt-2 text-sm text-text-secondary">{entry.symbol.replace(/\.JP$/,"")}</p>
    <div className="mt-4" data-research-status={entry.researchStatus.status}>
     <h3 className="text-xs font-semibold text-text-secondary">Research Status</h3>
     <p className={"mt-1 font-bold "+(entry.researchStatus.status==="GREEN"?"text-emerald-400":entry.researchStatus.status==="STAY"?"text-amber-400":"text-slate-400")}>
      {entry.researchStatus.status==="GREEN"?"研究条件成立":entry.researchStatus.publicLabel}
     </p>
     <p className="mt-1 text-xs leading-6 text-text-secondary">{entry.researchStatus.shortReason}</p>
    </div>
    <h3 className="mb-2 mt-5 font-semibold">What is changing</h3>
    <ul className="space-y-1 text-sm leading-7 text-text-secondary">{entry.whatIsChanging.map((text,i)=><li key={i}>{text}</li>)}</ul>
    <h3 className="mb-2 mt-4 font-semibold">Why Now</h3>
    <ul className="space-y-2 text-sm leading-7">{entry.whyNow.map((e,i)=>{const url=publicSourceUrl(e.sourceUrl);return <li key={i}>{publicLabel(e.label)}：{publicValue(e)}{url&&<> / <a href={url} target="_blank" rel="noopener noreferrer" className="underline">出典</a></>}</li>;})}</ul>
    <details className="mt-3 text-sm"><summary className="cursor-pointer text-text-secondary">一次資料の関係説明</summary>
    <ul className="space-y-3 text-sm leading-7">{entry.radarWhyNow.map((why,i)=>{
     const source=publicSourceUrl(why.sourceUrl);
     return <li key={i}><p>{why.quote}</p><small className="text-xs text-text-secondary">会社一次資料の説明 / {fiscalPeriodLabel(why.period)}{source&&<> / <a className="underline underline-offset-2" href={source} target="_blank" rel="noopener noreferrer">出典</a></>}</small></li>;
    })}</ul>
    </details>
    <div className="mt-5 border-t border-border pt-4">
     <h3 className="text-sm font-semibold text-cyan-300">Evidence Coverage</h3>
     <p className="mt-1 text-sm text-cyan-300">{Math.round(coverage)}%</p>
     <div role="progressbar" aria-label="Evidence Coverage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={coverage} className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-cyan-400" style={{width:coverage+"%"}} />
     </div>
     <p className="mt-2 text-xs leading-6 text-text-secondary">正式に採点可能な項目の配点割合。資料取得件数ではありません。</p>
     <h3 className="mt-4 text-sm font-semibold">TUTTOまとめ採点</h3>
     <p data-summary-display={score.display} className={"mt-1 text-xl font-bold "+(score.score===null?"text-slate-400":"text-lime-400")}>
      {score.score===null?"未算定":score.score+"%"}{score.display==="PROVISIONAL"&&<span className="ml-2 text-sm text-amber-300">暫定</span>}
     </p>
    </div>
    <section className="mt-5 text-sm leading-7"><h3 className="font-semibold">主要数値</h3>
     <ul className="mt-2 space-y-2">{entry.keyNumbers.map((e,i)=><li key={i}>{publicLabel(e.label)}：{publicValue(e)}</li>)}</ul>
    </section>
    <h3 className="mb-2 mt-5 font-semibold">主要Risk</h3>
    <ul className="space-y-1 text-sm leading-7 text-text-secondary">{entry.majorRisks.map((text,i)=><li key={i}>{text}</li>)}</ul>
    <h3 className="mb-2 mt-4 font-semibold">Next Confirmation</h3>
    <ul className="space-y-1 text-sm leading-7 text-text-secondary">{entry.nextConfirmation.map((text,i)=><li key={i}>{text}</li>)}</ul>
    <p className="mt-4 text-xs text-text-secondary">Evidence基準日：{fiscalPeriodLabel(entry.fiscalDate)}</p>
    <p className="mt-1 text-xs text-text-secondary">最終更新日：<time dateTime={entry.updatedAt}>{new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo'}).format(new Date(entry.updatedAt))}</time></p>
    <div className="mt-5"><StockLink href={"/stock-analysis/analyze/?"+new URLSearchParams({symbol:entry.symbol})}>詳しく分析する</StockLink></div>
   </article>;
  })}
 </div>;
}
