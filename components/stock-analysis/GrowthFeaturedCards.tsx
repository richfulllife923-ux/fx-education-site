import type {GrowthFeaturedCandidate} from "@/lib/growth-radar-public";
import {StockLink} from "./StockUI";

/** Display order and score are copied from the formal output; presentation performs no ranking. */
export default function GrowthFeaturedCards({entries}:{entries:GrowthFeaturedCandidate[]}){
 return <div className="grid min-w-0 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
  {entries.map((entry,index)=>{
   const score=entry.summaryScore;
   return <article key={entry.symbol} data-featured-symbol={entry.symbol} className={"card min-w-0 rounded-2xl p-5 [overflow-wrap:anywhere] sm:p-6"+(index===0?" border-cyan-400/40":"")}>
    <p className="mb-2 text-lg font-bold text-cyan-300" aria-label={"表示順 "+(entry.rank??index+1)}>#{entry.rank??index+1}</p>
    <h2 className="text-xl font-bold">{entry.companyName}</h2>
    <p className="mt-2 text-sm text-text-secondary">{entry.symbol.replace(/\.JP$/,"")}</p>
    <h3 className="mt-5 text-sm font-semibold">TUTTO 注目度</h3>
    <p data-summary-display={score.display} className={"mt-1 text-2xl font-bold "+(score.score===null?"text-slate-400":"text-lime-400")}>
     {score.score===null?"未算定":score.score+" / 100"}{score.display==="PROVISIONAL"&&<span className="ml-2 text-sm text-amber-300">暫定</span>}
    </p>
    <p className="mt-2 text-xs leading-6 text-text-secondary">正式な研究結果に基づく注目度です。株価上昇確率や売買シグナルを示すものではありません。</p>
    {(entry.shortReason??entry.researchStatus.shortReason)&&<p className="mt-4 text-sm leading-7 text-text-secondary">{entry.shortReason??entry.researchStatus.shortReason}</p>}
    <p className="mt-4 text-xs text-text-secondary">更新日時：<time dateTime={entry.updatedAt}>{new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'short',timeStyle:'short'}).format(new Date(entry.updatedAt))}</time></p>
    <div className="mt-5"><StockLink href={"/stock-analysis/analyze/?"+new URLSearchParams({symbol:entry.symbol})}>詳しく分析する</StockLink></div>
   </article>;
  })}
 </div>;
}
