import type { Evidence } from "@/lib/stock-analysis";
import { documentId, fiscalPeriodLabel, isFocusEvidence, publicLabel, publicSource, publicSourceUrl, publicValue } from "@/lib/stock-analysis-presentation";

export default function EvidenceView({item,showContext=false}:{item:Evidence;showContext?:boolean}) {
  const value=publicValue(item),short=value.length<28;
  return <div className="min-w-0 break-words text-sm leading-7">
    <dt className="font-medium text-text-secondary">{item.debt?.sourceType==="SOURCE_DECLARED_TOTAL"&&item.debt.scope==="CONSOLIDATED"?"連結有利子負債":publicLabel(item.label)}{item.kind==="INFERENCE" && <span className="ml-2 text-xs">見立て</span>}</dt>
    <dd className={short?"mt-1 text-lg font-semibold tabular-nums leading-8":"mt-1 leading-7"}>{value}
      {item.debt?.sourceType==="CALCULATED_FROM_COMPONENTS" && <p className="mt-1 text-xs font-normal text-text-secondary">構成要素から算出</p>}
      {showContext && <p className="mt-1 text-xs font-normal text-text-secondary">{fiscalPeriodLabel(item.period)} / {publicSource(item)}</p>}
    </dd>
  </div>;
}
export function EvidenceDisclosure({items,extraMetadata}:{items:Evidence[];extraMetadata?:unknown}) {
  if(!items.length && !extraMetadata)return null;
  return <details className="mt-5 min-w-0 border-t border-border pt-3">
    <summary className="cursor-pointer text-sm text-blue-300">詳細データを見る →</summary>
    <p className="mt-3 text-xs leading-6 text-text-secondary">億円・万円の表示は端数を省略しています。元の値、過年度・半期の数値、出典、計算根拠は以下で確認できます。</p>
    {!!extraMetadata && <details className="mt-3 text-xs"><summary className="cursor-pointer">Source metadata</summary><pre className="mt-2 max-w-full whitespace-pre-wrap break-all">{JSON.stringify(extraMetadata,null,2)}</pre></details>}
    <div className="mt-4 space-y-6">{items.map((item,index)=>{
      const url=publicSourceUrl(item.sourceUrl),id=documentId(item);
      return <div className="min-w-0 break-words border-b border-border pb-5 text-xs leading-6" key={index}>
        <p className="font-semibold">{item.label} / {item.period??"対象期間未確認"}</p>
        <dl className="mt-2 grid min-w-0 gap-x-4 gap-y-2 sm:grid-cols-[90px_minmax(0,1fr)]">
          <dt>元の値</dt><dd>{item.value}</dd>
          <dt>分類</dt><dd>{item.kind}</dd>
          <dt>確認状態</dt><dd>{item.confidence??"未確認"}</dd>
          <dt>出典</dt><dd>{url?<a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">{publicSource(item)}を見る →</a>:item.sourceTitle}<p>{item.sourceTitle}</p></dd>
          {id && <><dt>文書ID</dt><dd>{id}</dd></>}
          <dt>開示日</dt><dd>{item.filingDate??item.asOf}</dd>
          <dt>取得日</dt><dd>{item.retrievedAt??"未取得"}</dd>
          <dt>対象期間</dt><dd>{item.period??"未確認"}</dd>
          <dt>通貨 / 単位</dt><dd>{item.currency??"未確認"} / {item.unit??"未確認"}</dd>
          {item.field && <><dt>参照項目</dt><dd className="break-all">{item.field}</dd></>}
          {item.formula && <><dt>計算式</dt><dd className="break-all">{item.formula}</dd></>}
          {!!item.relatedFields?.length && <><dt>参照データ</dt><dd className="break-all">{item.relatedFields.join(" / ")}</dd></>}
        </dl>
        {!!item.inputs?.length && <div className="mt-3"><p className="font-semibold">入力値</p>{item.inputs.map((input,i)=><p className="mt-2 break-all" key={i}>{input.name}：{input.value??"未取得"} / {input.basis} / {input.period??"未確認"} / {input.currency??"未確認"} / {input.field}</p>)}</div>}
        {item.correction && <details className="mt-3"><summary className="cursor-pointer">訂正書類と原文の照合</summary><pre className="mt-2 max-w-full whitespace-pre-wrap break-all">{JSON.stringify(item.correction,null,2)}</pre></details>}
        {item.debt && <div className="mt-3 min-w-0 space-y-2">
          <p>Debt Source type：{item.debt.sourceType} / {item.debt.sourceType==="CALCULATED_FROM_COMPONENTS"?"構成要素から算出":item.debt.sourceType==="SOURCE_DECLARED_TOTAL"?"原文正式合計":"未確認"}</p>
          <p>Primary scope：{item.debt.scope} / {item.debt.fiscalDate}</p>
          <p>重複確認：{item.debt.doubleCount}</p>
          {item.debt.components.map((c,i)=><p className="break-all" key={i}>{c.name}：{c.value===null?"未取得":new Intl.NumberFormat("ja-JP").format(c.value)+" "+c.currency} / {c.fiscalDate} / {c.sourceField}</p>)}
          {item.debt.validationFormula && <p className="break-all">照合式：{item.debt.validationFormula} / 照合値：{item.debt.validationValue??"未確認"}</p>}
          {item.debt.checks.map((check,i)=><p className="break-all" key={i}>{check.passed?"確認済み":"未確認"}：{check.detail} {check.sourceField}</p>)}
          {!!item.debt.supplemental.length && <p>金融事業・自動車等は補足データです。連結Primaryの代替や単純合算には使いません。</p>}
        </div>}
        {item.debtRole==="SUPPLEMENTAL" && <p className="mt-2">補足データ / 連結Primaryとは区別</p>}
        <details className="mt-3"><summary className="cursor-pointer text-text-secondary">Source metadata</summary>
          <pre className="mt-2 max-w-full whitespace-pre-wrap break-all font-mono leading-6">{JSON.stringify(item,null,2)}</pre>
        </details>
      </div>;
    })}</div>
  </details>;
}
export function EvidenceList({items,focusPeriod,auditOnly=false,extraMetadata}:{items:Evidence[];focusPeriod?:string|null;auditOnly?:boolean;extraMetadata?:unknown}) {
  const visible=items.filter(item=>isFocusEvidence(item,focusPeriod));
  const contexts=[...new Set(visible.filter(item=>publicSource(item)!=="TUTTO").map(item=>fiscalPeriodLabel(item.period)+" / "+publicSource(item)))];
  return <>
    {!auditOnly && <dl className="space-y-4">{visible.map((item,index)=><EvidenceView item={item} showContext={contexts.length>1 && publicSource(item)!=="TUTTO"} key={index}/>)}</dl>}
    {!auditOnly && contexts.length===1 && <p className="mt-4 text-xs text-text-secondary">{contexts[0]}</p>}
    <EvidenceDisclosure items={items} extraMetadata={extraMetadata}/>
  </>;
}
