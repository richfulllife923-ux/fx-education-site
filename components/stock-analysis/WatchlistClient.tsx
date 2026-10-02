"use client";
import { useEffect, useState } from "react";
import type { GrowthFeaturedResult } from "@/lib/growth-radar-public";
import { loadFeatured } from "@/lib/featured-client";
import GrowthFeaturedCards from "./GrowthFeaturedCards";

const pendingMessages: Record<GrowthFeaturedResult["state"], string> = {
  COMPLETE: "現在、正式条件を満たす候補はありません。",
  IN_PROGRESS: "Universeの分析とEvidence確認を進めています。",
  RECHECK_REQUIRED: "最新のEvidenceを再確認しています。",
  COMPARISON_REQUIRED: "候補のEvidenceを比較・確認しています。",
};

export default function WatchlistClient() {
  const [result, setResult] = useState<GrowthFeaturedResult | null>(null);
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

  return <div className="min-w-0" data-featured-candidates data-featured-state={failed?"ERROR":result?.uiState??"LOADING"}>
    {!!result?.entries.length && <GrowthFeaturedCards entries={result.entries}/>}
    {!result?.entries.length && <div className="text-sm leading-7 text-text-secondary">
      <p role={failed?"alert":"status"}>{failed ? "現在、候補データを取得できません。" : result ? pendingMessages[result.state] : "候補データを確認中"}</p>
      {failed && <button className="stock-nav mt-3" onClick={() => setAttempt(value => value + 1)}>再確認</button>}
    </div>}
  </div>;
}
