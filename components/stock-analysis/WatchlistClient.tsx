"use client";
import { useEffect, useState } from "react";
import type { FeaturedResult } from "@/lib/top3-selection";
import { loadFeatured } from "@/lib/featured-client";
import { StockLink } from "./StockUI";
import { fiscalPeriodLabel, publicSourceUrl, publicLabel, publicValue } from "@/lib/stock-analysis-presentation";

const pendingMessages: Record<FeaturedResult["state"], string> = {
  COMPLETE: "現在、公開条件を満たす銘柄はありません。",
  IN_PROGRESS: "現在、候補のEvidenceを確認しています。",
  RECHECK_REQUIRED: "最新のEvidenceを再確認しています。",
  COMPARISON_REQUIRED: "候補のEvidenceを比較・確認しています。",
};

export default function WatchlistClient() {
  const [result, setResult] = useState<FeaturedResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setResult(null);
    setFailed(false);
    loadFeatured(controller.signal).then(value => {
      if (active) setResult(value);
    }).catch(() => {
      if (active) { setResult(null); setFailed(true); }
    });
    return () => { active = false; controller.abort(); };
  }, [attempt]);

  return <div className="min-w-0" data-featured-candidates>
    {!!result?.entries.length && <div className="grid min-w-0 items-start gap-5 lg:grid-cols-3">
      {result.entries.map((entry, index) => {
        const growthReview = entry.researchStatus.ruleTrace.find(trace => trace.ruleId === "R8" && trace.inputState === "MET" && trace.result === "PASS");
        return <article className="card min-w-0 p-5 sm:p-6" key={entry.symbol} data-featured-symbol={entry.symbol}>
          {/* Ordinal display numbers preserve the engine's order; no UI ranking. */}
          <p className="mb-2 text-lg font-bold text-emerald-400" aria-label={"表示順 " + (index + 1)}>#{index + 1}</p>
          <h2 className="break-words text-xl font-bold">{entry.companyName}</h2>
          <p className="mt-2 text-sm text-text-secondary">{entry.symbol.replace(/\.JP$/, "")} <span className="mx-1" aria-hidden="true">/</span> 業種：未取得</p>
          <h3 className="mb-2 mt-5 font-semibold">なぜ注目しているか</h3>
          <p className="text-sm leading-7 text-text-secondary">{growthReview?.reason ?? "成長変化の確認根拠は個別分析でご確認ください。"}</p>
          <h3 className="mb-2 mt-4 font-semibold">主要Growth Evidence</h3>
          <ul className="space-y-2 text-sm leading-7">
            {entry.whyNow.map((evidence, i) => {
              const source = publicSourceUrl(evidence.sourceUrl);
              return <li key={i} className="break-words">
                <span>{publicLabel(evidence.label)}：{publicValue(evidence)}</span>
                <small className="block text-xs text-text-secondary">
                  {fiscalPeriodLabel(evidence.period || entry.fiscalDate)}
                  {source && <> / <a href={source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" aria-label={publicLabel(evidence.label) + "の出典を見る"}>出典</a></>}
                </small>
              </li>;
            })}
          </ul>
          <div className="mt-5 border-t border-border pt-4" data-research-status={entry.researchStatus.status}>
            <h3 className="text-xs font-semibold text-text-secondary">Research Evidence Status</h3>
            <p className={"mt-2 font-bold " + (entry.researchStatus.status === "GREEN" ? "text-emerald-400" : "text-amber-400")}>{entry.researchStatus.publicLabel}</p>
            <p className="mt-1 text-xs leading-6 text-text-secondary">{entry.researchStatus.shortReason}</p>
          </div>
          <div className="mt-5"><StockLink href={"/stock-analysis/analyze/?" + new URLSearchParams({ symbol: entry.symbol })}>詳しく分析する</StockLink></div>
        </article>;
      })}
    </div>}
    {!result?.entries.length && <div className="text-sm leading-7 text-text-secondary">
      <p role="status">{failed ? "選抜結果を取得できませんでした。時間をおいて再確認してください。" : result ? pendingMessages[result.state] : "注目銘柄を確認しています…"}</p>
      {failed && <button className="stock-nav mt-3" onClick={() => setAttempt(value => value + 1)}>再確認</button>}
    </div>}
  </div>;
}
