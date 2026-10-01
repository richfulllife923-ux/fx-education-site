import type {SummaryScoreResult} from "@/lib/summary-score";
import {fiscalPeriodLabel} from "@/lib/stock-analysis-presentation";
function Bar({label,value,coverage=false}:{label:string;value:number|null;coverage?:boolean}) {
  return <div data-summary-component={coverage?"coverage":label} className="min-w-0">
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className="min-w-0">{label}</span><span className="shrink-0 tabular-nums text-text-secondary">{value===null?"未確認":Math.round(value)+"%"}</span>
    </div>
    {value===null?<div aria-hidden="true" className="mt-1 h-1.5 rounded-full bg-slate-700/60"/>:
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-700/60">
        <div className={"h-full rounded-full "+(coverage?"bg-slate-400":"bg-blue-400/70")} style={{width:value+"%"}}/>
      </div>}
  </div>;
}
export default function SummaryScoreCard({value,fiscalDate}:{value:SummaryScoreResult;fiscalDate?:string|null}) {
  return <section aria-label="TUTTOまとめ採点" data-summary-score={value.display} className="mt-4 min-w-0 rounded-card border border-border bg-background/40 p-4 sm:p-5">
    <p className="text-base font-semibold">TUTTOまとめ採点</p>
    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span data-summary-main className="text-4xl font-bold tabular-nums" aria-label={value.score===null?"総合指数は未算定":"TUTTOまとめ採点 "+value.score+"%"}>{value.score===null?"—":value.score+"%"}</span>
      {value.display!=="NORMAL"&&<span className="text-sm text-text-secondary">{value.display==="UNSCORED"?"未算定":"暫定"}</span>}
    </div>
    <p className="mt-1 text-xs text-text-secondary">観測ベース / 参考表示 / 投資助言ではありません</p>
    <p className="mt-3 text-xs leading-6 text-text-secondary">Evidence充足度 <span className="font-semibold tabular-nums">{Math.round(value.coverage)}%</span> · {fiscalPeriodLabel(fiscalDate)}</p>
    {value.display==="UNSCORED"&&<p className="text-xs leading-6 text-text-secondary">正式に評価できる範囲が60%未満のため、総合採点は未算定です。</p>}
    <dl className="mt-3 grid min-w-0 gap-x-6 gap-y-3 sm:grid-cols-2">
      {value.dimensions.map(d=><div key={d.id} className="min-w-0"><dt className="sr-only">{d.label}</dt><dd>
        <Bar label={d.label} value={d.score}/>
        {!d.complete&&d.score!==null&&<p className="mt-1 text-xs text-text-secondary">項目内の確認範囲：{Math.round(d.criterionCoverage)}%</p>}
      </dd></div>)}
    </dl>
    <div className="mt-4 border-t border-border pt-3"><Bar label="Evidence充足度" value={value.coverage} coverage/>
      <p className="mt-1 text-xs leading-5 text-text-secondary">充足度は確認範囲を示し、総合点への加点には使用しません。</p>
    </div>
    <p className="mt-4 text-xs leading-6 text-text-secondary">TUTTOまとめ採点は、公開情報とTUTTOの研究条件に基づく観測用の整理指標です。売買推奨、投資助言、利益保証、将来価格の保証ではありません。最終判断は利用者自身で行ってください。</p>
    <details className="mt-3 min-w-0"><summary className="cursor-pointer text-xs text-blue-300">採点の根拠を見る →</summary>
      <div className="mt-3 space-y-2 break-words text-xs leading-6 text-text-secondary">
        <p>Summary Score v1 / Owner制定：2026-10-01</p>
        <p>成立100・部分成立60・不成立0。未確認は計算対象外です。確認済み項目の配点で加重平均し、充足度60%未満は未算定、60〜79%は暫定、80%以上は通常表示です。</p>
        {value.dimensions.map(d=><div key={d.id}><p>{d.label}（配点{d.weight}） / 確認範囲{Math.round(d.criterionCoverage)}%</p>{d.criteria.map(c=><p key={c.id}>{c.reason}</p>)}</div>)}
        {!!value.issues.length&&<p>同じEvidenceの重複など、算定対象として確定できない条件は加点していません。</p>}
      </div>
    </details>
  </section>;
}
