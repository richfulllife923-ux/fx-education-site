import type { ResearchStatusResult } from "@/lib/research-status";
import type { StockReport } from "@/lib/stock-analysis";
import { fiscalPeriodLabel, publicValue } from "@/lib/stock-analysis-presentation";
export function ResearchStatusCard({value,compact=false}:{value:ResearchStatusResult;compact?:boolean}) {
 const color=value.status==="GREEN"?"border-emerald-800 bg-emerald-950/30":value.status==="STAY"?"border-amber-800 bg-amber-950/30":"border-slate-600 bg-slate-900/50";
 const marker=value.status==="GREEN"?"🟢":value.status==="STAY"?"🟡":"⚪";
 const confirmed=value.passedReasons.filter(v=>/最新正式年度|営業CF|FCF/.test(v)).slice(0,3);
 const wait=[...value.blockingReasons,...value.pendingReasons].filter(v=>v!==value.shortReason).slice(0,2);
 return <div className={"mt-4 min-w-0 rounded-card border p-4 sm:p-5 "+color} data-research-status={value.status}>
  <p className="text-xs font-semibold tracking-wider text-text-secondary">TUTTO RESEARCH STATUS</p>
  <p className="mt-2 break-words text-xl font-bold">{marker} {value.publicLabel}</p>
  <p className="mt-1 text-sm text-text-secondary">{value.status==="STAY"?"条件待ち":value.status==="GRAY"?"データ不足":"TUTTOの主要研究条件が成立しています。"}</p>
  <div className="mt-3 space-y-2 break-words text-sm leading-7">
   <p>{value.shortReason}</p>
   {!!confirmed.length&&<p><span className="text-text-secondary">確認済み：</span>{confirmed.join(" / ")}</p>}
   {!!wait.length&&!compact&&<p><span className="text-text-secondary">確認待ち：</span>{wait.join(" / ")}</p>}
   {!!value.nextChecks.length&&<p><span className="text-text-secondary">次に見る：</span>{value.nextChecks.slice(0,2).join(" / ")}</p>}
  </div>
  <p className="mt-4 text-xs leading-6 text-text-secondary">TUTTO Research Statusは、公開情報とTUTTOの研究条件の成立状況を示すものです。特定銘柄の売買を推奨するものではなく、投資助言、利益保証、将来価格保証を行うものではありません。</p>
  <details className="mt-3 min-w-0">
   <summary className="cursor-pointer text-sm text-blue-300">詳細データを見る →</summary>
   <div className="mt-3 space-y-3 break-words text-xs leading-6">
    <p>成立条件：{value.passedReasons.join(" / ")||"未確認"}</p>
    <p>確認待ち：{value.pendingReasons.join(" / ")||"確認待ち項目なし"}</p>
    <p>保留理由：{value.blockingReasons.join(" / ")||"保留条件は検出されていません。未確認Riskの不存在を保証するものではありません。"}</p>
    {!!value.existingResearchState&&<p>既存Research State：{value.existingResearchState}</p>}
    {!!value.ownerDecisionsRequired.length&&<p>管理者によるルール確定が必要な項目：{value.ownerDecisionsRequired.join(" / ")}</p>}
    <p>Rule Trace：{value.constitutionVersion} / {value.analysisVersion}</p>
    {value.ruleTrace.map((rule,index)=><p key={index}>{rule.ruleId} / {rule.inputState} / {rule.result}：{rule.reason}{rule.evidenceRefs.length?" / "+rule.evidenceRefs.join(", "):""}</p>)}
    <details><summary className="cursor-pointer">Source metadata</summary><pre className="mt-2 max-w-full whitespace-pre-wrap break-all">{JSON.stringify(value,null,2)}</pre></details>
   </div>
  </details>
 </div>;
}
export function KeyNumbers({report}:{report:StockReport}) {
 const wanted=[["performance","Revenue","売上"],["performance","Operating Income","営業利益"],["cash-flow","Operating CF","営業CF"],["cash-flow","Free Cash Flow","FCF"],["finance","Equity","純資産"]] as const;
 return <div className="mt-5" data-key-numbers>
  <dl className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">{wanted.map(([section,label,title])=>{
   const item=report.sections[section]?.find(v=>v.label===label && v.period?.startsWith("annual / ") && v.period.endsWith(report.metadata?.fiscalDate??"NO_PERIOD"));
   return <div className="min-w-0 rounded-card border border-border p-3" key={label}><dt className="text-xs text-text-secondary">{title}</dt><dd className="mt-2 break-words text-lg font-semibold tabular-nums">{item?publicValue(item):"未取得"}</dd></div>;
  })}</dl>
  <p className="mt-3 text-xs text-text-secondary">{fiscalPeriodLabel(report.metadata?.fiscalDate)} / {report.metadata?.provider??"出典未確認"}</p>
 </div>;
}
