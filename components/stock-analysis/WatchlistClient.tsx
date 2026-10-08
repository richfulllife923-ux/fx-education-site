"use client";
import {useEffect,useState} from "react";
import {loadObservation,type ObservationProjection} from "@/lib/public-observation";
import {formalUpdatedAtJst} from "@/lib/formal-updated-at";

export default function WatchlistClient(){
 const [result,setResult]=useState<ObservationProjection|null>(null);
 const [failed,setFailed]=useState(false),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let active=true;const controller=new AbortController();setLoading(true);setFailed(false);
  loadObservation(controller.signal).then(value=>{if(active)setResult(value);}).catch(()=>{if(active)setFailed(true);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;controller.abort();};
 },[attempt]);
 return <div className="min-w-0" data-featured-candidates data-featured-state={result?"READY":failed?"ERROR":"LOADING"}>
  <p className="mb-5 text-sm leading-7 text-text-secondary">年次財務に基づく公開用観測評価です。Formal Researchの認証結果とは異なります。</p>
  {result && <div className="grid min-w-0 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
   {result.top3.map(row=><article key={row.code} data-featured-symbol={row.code} className="card min-w-0 rounded-2xl p-5 [overflow-wrap:anywhere] sm:p-6">
    <p className="mb-2 text-lg font-bold text-cyan-300">#{row.rank}</p>
    <h2 className="text-xl font-bold">{row.name}</h2><p className="mt-2 text-sm text-text-secondary">{row.code}</p>
    <h3 className="mt-5 text-sm font-semibold">TUTTO 注目度</h3><p className="mt-1 text-2xl font-bold text-lime-400">{row.score}%</p>
   </article>)}
  </div>}
  {loading && <p role="status" className="mt-4 text-sm text-text-secondary">保存済みの評価を取得中…</p>}
  {failed && <p role="alert" className="mt-4 text-sm text-text-secondary">最新の保存済み評価を取得できませんでした。{result?"前回取得した結果を表示しています。":"再取得してください。"}</p>}
  {result && <p className="mt-6 text-sm text-text-secondary"><time data-observation-updated-at dateTime={result.generated_at}>最終更新：{formalUpdatedAtJst(result.generated_at)}</time></p>}
  <button type="button" disabled={loading} className="stock-nav mt-5 disabled:opacity-50" onClick={()=>setAttempt(x=>x+1)}>最新の保存済み結果を取得</button>
  {result && <details className="mt-5 text-xs leading-6 text-text-secondary"><summary className="cursor-pointer">評価方法・対象データ</summary><p className="mt-2">保存済みの連結年次財務{result.cohort_count.toLocaleString("ja-JP")}社について、売上成長率・営業利益率・営業CF比率の順位を幾何平均し、0〜100で表示しています。株価や将来業績の予測は含みません。各社の決算期は異なります。</p><ul>{result.top3.map(row=><li key={row.code}>{row.code}：{row.period}期</li>)}</ul><p>データ取得基準：{formalUpdatedAtJst(result.data_observed_at)}。更新ボタンは再計算せず、最新の保存済み評価を取得します。</p></details>}
  <p className="mt-6 text-xs leading-6 text-text-secondary">TUTTO注目度は独自の観測スコアであり、将来の株価上昇確率や投資成果を示すものではありません。</p>
 </div>;
}
