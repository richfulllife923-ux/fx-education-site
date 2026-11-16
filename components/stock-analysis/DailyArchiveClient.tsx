"use client";

import { useEffect, useState } from "react";
import { parsePublishedDailyAnalysis, type PublishedDailyAnalysis } from "@/lib/daily-analysis-content";
import featuredStyles from "./FeaturedFiveClient.module.css";
import styles from "./DailyArchiveClient.module.css";

type ArchiveIndexEntry = {
  id: string;
  date: string;
  title: string;
  companyName: string;
  ticker: string;
  publishedAt: string;
};

type ListState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error" }
  | { status: "ready"; items: ArchiveIndexEntry[] };

type ArticleState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; article: PublishedDailyAnalysis };

const ARCHIVE_ID_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}(-\d+)?$/;

function parseArchiveIndex(value: unknown): ArchiveIndexEntry[] {
  if (!Array.isArray(value)) throw new Error("DAILY_ARCHIVE_UNAVAILABLE");
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("DAILY_ARCHIVE_UNAVAILABLE");
    const entry = item as Record<string, unknown>;
    if (
      typeof entry.id !== "string" ||
      !ARCHIVE_ID_PATTERN.test(entry.id) ||
      typeof entry.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
      typeof entry.title !== "string" ||
      !entry.title.trim() ||
      typeof entry.companyName !== "string" ||
      !entry.companyName.trim() ||
      typeof entry.ticker !== "string" ||
      !entry.ticker.trim() ||
      typeof entry.publishedAt !== "string" ||
      !Number.isFinite(Date.parse(entry.publishedAt))
    ) {
      throw new Error("DAILY_ARCHIVE_UNAVAILABLE");
    }
    return {
      id: entry.id,
      date: entry.date,
      title: entry.title,
      companyName: entry.companyName,
      ticker: entry.ticker,
      publishedAt: entry.publishedAt,
    };
  });
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

export default function DailyArchiveClient() {
  const [attempt, setAttempt] = useState(0);
  const [listView, setListView] = useState<ListState>({ status: "loading" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [articleAttempt, setArticleAttempt] = useState(0);
  const [articleView, setArticleView] = useState<ArticleState>({ status: "idle" });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    setListView({ status: "loading" });
    void (async () => {
      try {
        const response = await fetch("/api/daily-analysis?archive=1", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("DAILY_ARCHIVE_UNAVAILABLE");
        const result = (await response.json()) as { status?: unknown; items?: unknown };
        if (result.status === "empty") {
          if (!controller.signal.aborted) setListView({ status: "empty" });
          return;
        }
        if (result.status !== "ready") throw new Error("DAILY_ARCHIVE_UNAVAILABLE");
        const items = parseArchiveIndex(result.items);
        if (!controller.signal.aborted) setListView({ status: "ready", items });
      } catch {
        if (!controller.signal.aborted) setListView({ status: "error" });
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
    if (!selectedId) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    setArticleView({ status: "loading" });
    void (async () => {
      try {
        const response = await fetch(`/api/daily-analysis?id=${encodeURIComponent(selectedId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("DAILY_ARCHIVE_UNAVAILABLE");
        const result = (await response.json()) as { status?: unknown; article?: unknown };
        const article = parsePublishedDailyAnalysis(result.article);
        if (result.status !== "ready" || !article) throw new Error("DAILY_ARCHIVE_INVALID");
        if (!controller.signal.aborted) setArticleView({ status: "ready", article });
      } catch {
        if (!controller.signal.aborted) setArticleView({ status: "error" });
      } finally {
        window.clearTimeout(timeout);
      }
    })();

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [selectedId, articleAttempt]);

  return (
    <div aria-live="polite" aria-busy={listView.status === "loading"}>
      {listView.status === "loading" && (
        <p className={featuredStyles.state} role="status">過去の市場分析を読み込んでいます…</p>
      )}

      {listView.status === "empty" && (
        <p className={featuredStyles.state} role="status">公開済みのアーカイブはまだありません。</p>
      )}

      {listView.status === "error" && (
        <div className={featuredStyles.state} role="alert">
          <p>過去の市場分析の一覧を取得できませんでした。</p>
          <button className={featuredStyles.retry} type="button" onClick={() => setAttempt((value) => value + 1)}>
            再読み込み
          </button>
        </div>
      )}

      {listView.status === "ready" && (
        <ol className={styles.archiveList}>
          {listView.items.map((item) => (
            <li key={item.id}>
              <button
                className={styles.archiveItem}
                type="button"
                aria-current={selectedId === item.id ? "true" : undefined}
                onClick={() => setSelectedId(item.id)}
              >
                <time className={styles.archiveDate} dateTime={item.date}>
                  {item.date.replaceAll("-", "/")} JST
                </time>
                <span className={styles.archiveTitle}>{item.title}</span>
                <span className={styles.archiveCompany}>
                  {item.companyName}（{item.ticker}）
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {selectedId && articleView.status === "loading" && (
        <p className={`${featuredStyles.state} ${styles.articleState}`} role="status">記事を読み込んでいます…</p>
      )}

      {selectedId && articleView.status === "error" && (
        <div className={`${featuredStyles.state} ${styles.articleState}`} role="alert">
          <p>記事を取得できませんでした。</p>
          <button
            className={featuredStyles.retry}
            type="button"
            onClick={() => setArticleAttempt((value) => value + 1)}
          >
            再読み込み
          </button>
        </div>
      )}

      {articleView.status === "ready" && (
        <article className={featuredStyles.dailyEntry} aria-labelledby="archive-entry-heading">
          <h3 id="archive-entry-heading">{articleView.article.title}</h3>
          <p className={featuredStyles.dailyMeta}>
            <time dateTime={articleView.article.date}>{articleView.article.date.replaceAll("-", "/")} JST</time>
            <span aria-hidden="true"> · </span>
            {articleView.article.companyName}（{articleView.article.ticker}）
          </p>
          <p>{articleView.article.introduction}</p>
          {articleView.article.sections.map((section) => (
            <section className={featuredStyles.dailyArticleSection} key={section.heading}>
              <h4>{section.heading}</h4>
              {section.paragraphs.map((paragraph, index) => (
                <p key={`${section.heading}-p-${index}`}>{paragraph}</p>
              ))}
              {section.points.length > 0 && (
                <ul>
                  {section.points.map((point, index) => (
                    <li key={`${section.heading}-i-${index}`}>{point}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <div className={featuredStyles.dailySources}>
            <h4>参照した公式資料</h4>
            <ul>
              {articleView.article.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p className={featuredStyles.dailyPublished}>
            公開更新：<time dateTime={articleView.article.publishedAt}>{updatedJst(articleView.article.publishedAt)}</time>
          </p>
        </article>
      )}
    </div>
  );
}
