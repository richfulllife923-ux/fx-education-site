"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { analysisSections, normalizeStockInput, stockAnalysisAdapter, type AnalysisResult } from "@/lib/stock-analysis";
import StockSearch from "./StockSearch";

export function useStockReport(symbol: string) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  useEffect(() => {
    let active = true;
    setResult(null);
    if (symbol && symbol.length <= 100) {
      stockAnalysisAdapter.analyze(symbol)
        .then(value => { if (active) setResult(value); })
        .catch(() => { if (active) setResult({ status: "error", message: "データを取得できませんでした。時間をおいて再度お試しください。" }); });
    }
    return () => { active = false; };
  }, [symbol]);
  return result;
}
export default function AnalysisClient() {
  const params = useSearchParams();
  const symbol = normalizeStockInput(params.get("symbol") ?? "");
  const valid = !!symbol && symbol.length <= 100;
  const result = useStockReport(valid ? symbol : "");
  return <>
    <StockSearch key={symbol} initialValue={symbol.slice(0, 100)} />
    {!valid ? <p className="mt-6" role="status">有効な銘柄名・証券コード・Tickerを入力してください。</p> : <>
      <div className="mt-8 card p-5 sm:p-6" role="status" aria-live="polite">
        <p className="break-words text-xl font-semibold">{result?.status === "ready" ? result.report.companyName : "入力した銘柄："+symbol}</p>
        <p className="mt-2 text-sm leading-7 text-text-secondary">{!result ? "データの接続状況を確認しています…" : result.status === "ready" ? "分析日："+result.report.analyzedAt+" / "+result.report.symbol : result.message}</p>
        <p className="mt-2 text-xs text-text-secondary">会社名・市場の確定には企業データの照合が必要です。</p>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {analysisSections.map((section, index) => {
          const evidence = result?.status === "ready" ? result.report.sections[section.id] : undefined;
          return <section key={section.id} className="card min-w-0 p-5 sm:p-6">
            <p className="eyebrow text-emerald-400">SECTION {String(index+1).padStart(2, "0")}</p>
            <h2 className="text-xl font-bold">{section.title}</h2>
            {section.id === "scenarios" && <p className="mt-3 text-sm leading-7 text-text-secondary">Bull / Base / Bearは条件別Scenarioです。将来の株価や利益を保証しません。</p>}
            <ul className="mt-4 flex flex-wrap gap-2">{section.items.map(item => <li className="badge" key={item}>{item}</li>)}</ul>
            {evidence?.length ? <dl className="mt-5 space-y-4">{evidence.map((item, i) => <div key={i} className="break-words text-sm leading-7">
              <dt className="font-semibold">{item.label} <span className="badge">{item.kind}</span></dt>
              <dd>{item.value}<p className="text-xs text-text-secondary">{[item.asOf, item.period, item.currency, item.unit].filter(Boolean).join(" / ")}</p>
                {/^https?:\/\//.test(item.sourceUrl) && <a className="text-blue-300 underline" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.sourceTitle} →</a>}
              </dd>
            </div>)}</dl> : <p className="mt-5 text-sm leading-7 text-text-secondary">未取得 — 一次資料を確認してから表示します。</p>}
          </section>;
        })}
      </div>
    </>}
  </>;
}
