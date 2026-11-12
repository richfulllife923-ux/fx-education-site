"use client";

import { useEffect, useState } from "react";
import styles from "./FeaturedFiveClient.module.css";

type PublicStock = { rank: number; code: string; name: string; score: number };
type PublicRanking = { updatedAt: string; stocks: PublicStock[] };

type ViewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; ranking: PublicRanking };

function parseRanking(value: unknown): PublicRanking {
  if (!value || typeof value !== "object") throw new Error("PUBLIC_RANKING_UNAVAILABLE");
  const observation = value as {
    publication_status?: unknown;
    generated_at?: unknown;
    top5?: unknown;
  };
  if (
    observation.publication_status !== "READY" ||
    typeof observation.generated_at !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(observation.generated_at) ||
    !Number.isFinite(Date.parse(observation.generated_at)) ||
    Date.parse(observation.generated_at) > Date.now() ||
    !Array.isArray(observation.top5) ||
    observation.top5.length > 5
  ) {
    throw new Error("PUBLIC_RANKING_UNAVAILABLE");
  }

  const seen = new Set<string>();
  let previousScore = 100;
  const stocks = observation.top5.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error("PUBLIC_RANKING_UNAVAILABLE");
    const row = item as Record<string, unknown>;
    if (
      row.rank !== index + 1 ||
      typeof row.code !== "string" ||
      !/^[0-9]{3}[0-9A-Z]$/.test(row.code) ||
      seen.has(row.code) ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      row.name.length >= 160 ||
      !Number.isInteger(row.score) ||
      (row.score as number) < 0 ||
      (row.score as number) > 100 ||
      (row.score as number) > previousScore
    ) {
      throw new Error("PUBLIC_RANKING_UNAVAILABLE");
    }
    seen.add(row.code);
    previousScore = row.score as number;
    return {
      rank: row.rank as number,
      code: row.code,
      name: row.name,
      score: row.score as number,
    };
  });

  return { updatedAt: observation.generated_at, stocks };
}

function updatedJst(value: string) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}/${part("month")}/${part("day")} ${part("hour")}:${part("minute")} JST`;
}

export default function FeaturedFiveClient() {
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    setView({ status: "loading" });
    void (async () => {
      try {
        const response = await fetch("/api/stock-analysis/observation-v2", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("PUBLIC_RANKING_UNAVAILABLE");
        const ranking = parseRanking((await response.json()) as unknown);
        if (!controller.signal.aborted) setView({ status: "ready", ranking });
      } catch {
        if (!controller.signal.aborted) setView({ status: "error" });
      } finally {
        window.clearTimeout(timeout);
      }
    })();

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  const ranking = view.status === "ready" ? view.ranking : null;
  const count = ranking?.stocks.length ?? 0;
  const isPartial = count > 0 && count < 5;

  return (
    <div className={styles.page}>
      <div className="container-page">
        <header className={styles.hero}>
          <p className={styles.eyebrow}>TUTTO MARKET OBSERVATION</p>
          <h1>TUTTO 注目5銘柄</h1>
          <p className={styles.lead}>
            企業の決算・財務・成長性・企業価値・リスクを扱う、TUTTO投資術の株式分析を紹介します。
          </p>
          <p className={styles.intro}>
            下の順位と注目度は、保存済みの公開評価データを表示しています。
          </p>
        </header>

        <section className={styles.framework} aria-labelledby="framework-heading">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>TUTTO INVESTMENT RESEARCH</p>
            <h2 id="framework-heading">企業を見る主な観点</h2>
            <p>
              市場構造のMT5 Indicatorとは別の、企業・財務を対象とした分析です。以下は広い分析観点の紹介であり、下の公開ランキングの評価・順位をこのページで再計算するものではありません。
            </p>
          </div>
          <ul className={styles.frameworkGrid}>
            <li>事業と需要</li>
            <li>業績と成長性</li>
            <li>収益力</li>
            <li>キャッシュフロー</li>
            <li>財務と持続性</li>
            <li>企業価値・価格・リスク</li>
          </ul>
        </section>

        <section className={styles.ranking} aria-labelledby="ranking-heading">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>PUBLIC OBSERVATION</p>
            <h2 id="ranking-heading">公開ランキング</h2>
            <p>順位・スコアは評価時点の観測結果です。将来の成果を示すものではありません。</p>
          </div>

          <div className={styles.results} aria-live="polite" aria-busy={view.status === "loading"}>
            {view.status === "loading" && (
              <p className={styles.state} role="status">正式な公開データを読み込んでいます…</p>
            )}

            {view.status === "error" && (
              <div className={styles.state} role="alert">
                <p>保存済みの正式な公開データを取得できませんでした。古いデータは表示していません。</p>
                <button className={styles.retry} type="button" onClick={() => setAttempt((value) => value + 1)}>
                  再読み込み
                </button>
              </div>
            )}

            {view.status === "ready" && count === 0 && (
              <p className={styles.state} role="status">現在公開中の銘柄はありません。</p>
            )}

            {view.status === "ready" && isPartial && (
              <p className={styles.partial} role="status">
                現在公開中の銘柄は{count}件です。確認済みのデータのみ表示しています。
              </p>
            )}

            {ranking && count > 0 && (
              <ol className={styles.stockGrid}>
                {ranking.stocks.map((stock) => (
                  <li className={styles.stockCard} key={stock.code}>
                    <p className={styles.rank}>#{stock.rank}</p>
                    <h3>{stock.name}</h3>
                    <p className={styles.code}>{stock.code}</p>
                    <div className={styles.scoreBlock}>
                      <span>TUTTO 注目度</span>
                      <strong>{stock.score}%</strong>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {ranking && (
            <p className={styles.updated}>
              最終更新：<time dateTime={ranking.updatedAt}>{updatedJst(ranking.updatedAt)}</time>
            </p>
          )}
        </section>

        <section className={styles.dailyAnalysis} aria-labelledby="daily-analysis-heading">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>DAILY STOCK ANALYSIS</p>
            <h2 id="daily-analysis-heading">毎日のTUTTO株式分析</h2>
          </div>
          <article className={styles.dailyEntry} aria-labelledby="daily-entry-heading">
            <h3 id="daily-entry-heading">本日の分析</h3>
            <p>企業の業績・財務・成長性・企業価値・リスクを日々分析し、この欄に掲載します。</p>
          </article>
        </section>

        <aside className={styles.notes} aria-label="重要な注記">
          <p>本ページの公開観測ランキングは、Formal Researchの認証・承認結果とは異なります。</p>
          <p>
            表示される順位と注目度は評価時点の観測結果であり、株価上昇確率・将来の利益・投資成果を保証するものではありません。売買指示や投資助言ではありません。
          </p>
          <p>
            本ページは情報提供・研究・教育を目的としています。投資判断はご自身の責任で行ってください。
          </p>
        </aside>
      </div>
    </div>
  );
}
