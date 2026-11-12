"use client";

import { useEffect, useState } from "react";
import { parsePublishedDailyAnalysis, type PublishedDailyAnalysis } from "@/lib/daily-analysis-content";
import styles from "./FeaturedFiveClient.module.css";

type PublicStock = { rank: number; code: string; name: string; score: number };
type PublicRanking = { updatedAt: string; stocks: PublicStock[] };

type ViewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; ranking: PublicRanking };

type DailyViewState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error" }
  | { status: "ready"; article: PublishedDailyAnalysis };

type EarlyStock = {
  rank: number;
  code: string;
  name: string;
  market: "JP" | "US";
  momentumScore: number;
  dataCoverage: number;
  classification: string;
  judgment: string;
  headline: string;
  source: { label: string; url: string; publishedDate: string; period: string };
};
type EarlyRanking = { updatedAt: string; entries: EarlyStock[] };

type EarlyViewState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; ranking: EarlyRanking };

const EARLY_CLASSIFICATION_LABELS: Record<string, string> = {
  VALUE_UP: "企業価値向上の兆候",
  VALUE_DOWN: "企業価値悪化の兆候",
  MOMENTUM_UP: "短期業績の改善",
  MOMENTUM_DOWN: "短期業績の悪化",
  STRUCTURAL_CHANGE: "産業・事業構造の変化",
  TEMPORARY: "一時的な変動",
  UNCONFIRMED: "未確認",
};

const EARLY_JUDGMENT_LABELS: Record<string, string> = {
  STRONG_EARLY_CANDIDATE: "強い先行注目候補",
  EARLY_CANDIDATE: "先行注目候補",
  WATCH: "継続監視",
  NEUTRAL: "中立",
  RISK: "悪化警戒",
  REJECT: "候補除外",
  DATA_INSUFFICIENT: "情報不足",
};

function parseEarlyDetection(value: unknown): EarlyRanking {
  if (!value || typeof value !== "object") throw new Error("EARLY_DETECTION_UNAVAILABLE");
  const doc = value as { publication_status?: unknown; generated_at?: unknown; entries?: unknown };
  if (
    doc.publication_status !== "READY" ||
    typeof doc.generated_at !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(doc.generated_at) ||
    !Number.isFinite(Date.parse(doc.generated_at)) ||
    Date.parse(doc.generated_at) > Date.now() ||
    !Array.isArray(doc.entries) ||
    doc.entries.length < 1 ||
    doc.entries.length > 10
  ) {
    throw new Error("EARLY_DETECTION_UNAVAILABLE");
  }
  const seen = new Set<string>();
  let previousScore = 100;
  const entries = doc.entries.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error("EARLY_DETECTION_UNAVAILABLE");
    const row = item as Record<string, unknown>;
    const source = row.source as Record<string, unknown> | undefined;
    const codeOk =
      (row.market === "JP" && typeof row.code === "string" && /^[0-9]{3}[0-9A-Z]$/.test(row.code)) ||
      (row.market === "US" && typeof row.code === "string" && /^[A-Z]{1,5}(\.[A-Z])?$/.test(row.code));
    if (
      row.rank !== index + 1 ||
      !codeOk ||
      seen.has(`${row.market}:${row.code}`) ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      row.name.length >= 160 ||
      !Number.isInteger(row.momentumScore) ||
      (row.momentumScore as number) < 0 ||
      (row.momentumScore as number) > previousScore ||
      !Number.isInteger(row.dataCoverage) ||
      (row.dataCoverage as number) < 0 ||
      (row.dataCoverage as number) > 100 ||
      typeof row.classification !== "string" ||
      !(row.classification in EARLY_CLASSIFICATION_LABELS) ||
      typeof row.judgment !== "string" ||
      !(row.judgment in EARLY_JUDGMENT_LABELS) ||
      typeof row.headline !== "string" ||
      !row.headline.trim() ||
      row.headline.length > 300 ||
      !source ||
      typeof source.label !== "string" ||
      !source.label.trim() ||
      typeof source.url !== "string" ||
      !source.url.startsWith("https://") ||
      typeof source.publishedDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(source.publishedDate) ||
      typeof source.period !== "string" ||
      !source.period.trim()
    ) {
      throw new Error("EARLY_DETECTION_UNAVAILABLE");
    }
    seen.add(`${row.market}:${row.code}`);
    previousScore = row.momentumScore as number;
    return {
      rank: row.rank as number,
      code: row.code as string,
      name: row.name as string,
      market: row.market as "JP" | "US",
      momentumScore: row.momentumScore as number,
      dataCoverage: row.dataCoverage as number,
      classification: row.classification as string,
      judgment: row.judgment as string,
      headline: row.headline as string,
      source: {
        label: source.label as string,
        url: source.url as string,
        publishedDate: source.publishedDate as string,
        period: source.period as string,
      },
    };
  });
  return { updatedAt: doc.generated_at, entries };
}

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
  const [dailyAttempt, setDailyAttempt] = useState(0);
  const [dailyView, setDailyView] = useState<DailyViewState>({ status: "loading" });
  const [earlyAttempt, setEarlyAttempt] = useState(0);
  const [earlyView, setEarlyView] = useState<EarlyViewState>({ status: "loading" });

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

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    setDailyView({ status: "loading" });
    void (async () => {
      try {
        const response = await fetch("/api/daily-analysis", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("DAILY_ANALYSIS_UNAVAILABLE");
        const result = (await response.json()) as { status?: unknown; article?: unknown };
        if (result.status === "empty") {
          if (!controller.signal.aborted) setDailyView({ status: "empty" });
          return;
        }
        const article = parsePublishedDailyAnalysis(result.article);
        if (result.status !== "ready" || !article) throw new Error("DAILY_ANALYSIS_INVALID");
        if (!controller.signal.aborted) setDailyView({ status: "ready", article });
      } catch {
        if (!controller.signal.aborted) setDailyView({ status: "error" });
      } finally {
        window.clearTimeout(timeout);
      }
    })();

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [dailyAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    setEarlyView({ status: "loading" });
    void (async () => {
      try {
        const response = await fetch("/api/stock-analysis/early-detection", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("EARLY_DETECTION_UNAVAILABLE");
        const ranking = parseEarlyDetection((await response.json()) as unknown);
        if (!controller.signal.aborted) setEarlyView({ status: "ready", ranking });
      } catch {
        if (!controller.signal.aborted) setEarlyView({ status: "unavailable" });
      } finally {
        window.clearTimeout(timeout);
      }
    })();

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [earlyAttempt]);

  const ranking = view.status === "ready" ? view.ranking : null;
  const count = ranking?.stocks.length ?? 0;
  const isPartial = count > 0 && count < 5;
  const earlyRanking = earlyView.status === "ready" ? earlyView.ranking : null;

  return (
    <div className={styles.page}>
      <div className="container-page">
        <header className={styles.hero}>
          <p className={styles.eyebrow}>TUTTO MARKET OBSERVATION</p>
          <h1>TUTTO 注目5銘柄</h1>
          <p className={styles.lead}>
            企業の決算・財務・成長性・企業価値・リスクを扱う、TUTTO市場分析を公開しています。
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

        <section className={styles.earlyDetection} aria-labelledby="early-detection-heading">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>EARLY VALUE DETECTOR</p>
            <h2 id="early-detection-heading">先行発掘（四半期モメンタム）</h2>
            <p>
              上の公開ランキング（年次決算に基づく評価）とは別の、独立した評価です。四半期決算・業績修正・事業環境の変化から、企業価値が変化し始めた兆候を検出します。このスコアは公開ランキングのスコアに加算されません。
            </p>
          </div>

          <div className={styles.results} aria-live="polite" aria-busy={earlyView.status === "loading"}>
            {earlyView.status === "loading" && (
              <p className={styles.state} role="status">先行発掘データを読み込んでいます…</p>
            )}

            {earlyView.status === "unavailable" && (
              <div className={styles.state} role="alert">
                <p>現在公開中の先行発掘データはありません。</p>
                <button className={styles.retry} type="button" onClick={() => setEarlyAttempt((value) => value + 1)}>
                  再読み込み
                </button>
              </div>
            )}

            {earlyRanking && (
              <ol className={styles.stockGrid}>
                {earlyRanking.entries.map((stock) => (
                  <li className={styles.stockCard} key={`${stock.market}:${stock.code}`}>
                    <p className={styles.rank}>#{stock.rank}</p>
                    <h3>{stock.name}</h3>
                    <p className={styles.code}>
                      {stock.code}
                      <span className={styles.marketBadge}>{stock.market === "JP" ? "日本株" : "米国株"}</span>
                    </p>
                    <p className={styles.earlyJudgment}>
                      {EARLY_JUDGMENT_LABELS[stock.judgment]}／{EARLY_CLASSIFICATION_LABELS[stock.classification]}
                    </p>
                    <p className={styles.earlyHeadline}>{stock.headline}</p>
                    <p className={styles.earlySource}>
                      根拠：<a href={stock.source.url} target="_blank" rel="noopener noreferrer">{stock.source.label}</a>
                      （{stock.source.publishedDate.replaceAll("-", "/")}公表・{stock.source.period}）
                    </p>
                    <div className={styles.scoreBlock}>
                      <span>モメンタム（充足率{stock.dataCoverage}%）</span>
                      <strong>{stock.momentumScore}</strong>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {earlyRanking && (
            <p className={styles.updated}>
              最終更新：<time dateTime={earlyRanking.updatedAt}>{updatedJst(earlyRanking.updatedAt)}</time>
            </p>
          )}
        </section>

        <section className={styles.dailyAnalysis} aria-labelledby="daily-analysis-heading">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>TUTTO DAILY MARKET ANALYSIS</p>
            <h2 id="daily-analysis-heading">毎日のTUTTO市場分析</h2>
          </div>
          <div className={styles.dailyEntryState} aria-live="polite" aria-busy={dailyView.status === "loading"}>
            {dailyView.status === "loading" && (
              <p className={styles.state} role="status">毎日の市場分析を読み込んでいます…</p>
            )}
            {dailyView.status === "empty" && (
              <p className={styles.state} role="status">本日の分析はまだ公開されていません。</p>
            )}
            {dailyView.status === "error" && (
              <div className={styles.state} role="alert">
                <p>毎日の市場分析を取得できませんでした。</p>
                <button className={styles.retry} type="button" onClick={() => setDailyAttempt((value) => value + 1)}>
                  再読み込み
                </button>
              </div>
            )}
            {dailyView.status === "ready" && (
              <article className={styles.dailyEntry} aria-labelledby="daily-entry-heading">
                <h3 id="daily-entry-heading">{dailyView.article.title}</h3>
                <p className={styles.dailyMeta}>
                  <time dateTime={dailyView.article.date}>{dailyView.article.date.replaceAll("-", "/")} JST</time>
                  <span aria-hidden="true"> · </span>
                  {dailyView.article.companyName}（{dailyView.article.ticker}）
                </p>
                <p>{dailyView.article.introduction}</p>
                {dailyView.article.sections.map((section) => (
                  <section className={styles.dailyArticleSection} key={section.heading}>
                    <h4>{section.heading}</h4>
                    {section.paragraphs.map((paragraph, index) => <p key={`${section.heading}-p-${index}`}>{paragraph}</p>)}
                    {section.points.length > 0 && (
                      <ul>
                        {section.points.map((point, index) => <li key={`${section.heading}-i-${index}`}>{point}</li>)}
                      </ul>
                    )}
                  </section>
                ))}
                <div className={styles.dailySources}>
                  <h4>参照した公式資料</h4>
                  <ul>
                    {dailyView.article.sources.map((source) => (
                      <li key={source.url}>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className={styles.dailyPublished}>
                  公開更新：<time dateTime={dailyView.article.publishedAt}>{updatedJst(dailyView.article.publishedAt)}</time>
                </p>
              </article>
            )}
          </div>
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
