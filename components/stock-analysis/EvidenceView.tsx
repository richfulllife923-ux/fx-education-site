import type { Evidence } from "@/lib/stock-analysis";
export default function EvidenceView({item}:{item:Evidence}) {
  return <div className="break-words text-sm leading-7">
    <dt className="font-semibold">{item.label} <span className="badge">{item.kind}</span></dt>
    <dd>{item.value}<p className="text-xs text-text-secondary">{[item.asOf,item.period,item.currency,item.unit,item.confidence].filter(Boolean).join(" / ")}</p>
      {item.retrievedAt && <p className="text-xs text-text-secondary">取得：{item.retrievedAt}{item.filingDate?" / 開示日："+item.filingDate:""}</p>}
      {/^https?:\/\//.test(item.sourceUrl) && <a className="text-blue-300 underline" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.sourceTitle} →</a>}
      {(item.formula || item.field || item.relatedFields?.length) && <details className="mt-2">
        <summary className="cursor-pointer text-xs text-text-secondary">計算・参照データを確認</summary>
        <p className="text-xs">{item.formula??item.field??item.relatedFields?.join(" / ")}</p>
        {item.inputs?.map((input,index)=><p className="text-xs" key={index}>{input.name}：{input.value??"未取得"} / {input.basis} / {input.period??"基準日未確認"} / {input.currency??"通貨未確認"} / {input.field}</p>)}
      </details>}
    </dd>
  </div>;
}
