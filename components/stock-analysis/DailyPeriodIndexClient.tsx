"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  parseArchiveIndex,
  type ArchiveIndexEntry,
} from "@/components/stock-analysis/DailyArchiveClient";
import {
  mondayOfWeek,
  monthKeyOf,
  monthLabel,
  weekName,
  weekRangeLabel,
} from "@/lib/archive-periods";
import featuredStyles from "./FeaturedFiveClient.module.css";
import styles from "./DailyArchiveClient.module.css";

type PeriodGroup = {
  key: string;
  title: string;
  detail: string;
  count: number;
};

type ListState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error" }
  | { status: "ready"; groups: PeriodGroup[] };

function groupByPeriod(items: ArchiveIndexEntry[], kind: "week" | "month"): PeriodGroup[] {
  const groups = new Map<string, PeriodGroup>();
  for (const item of items) {
    const key = kind === "week" ? mondayOfWeek(item.date) : monthKeyOf(item.date);
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, {
        key,
        title: kind === "week" ? weekName(key) : monthLabel(key),
        detail: kind === "week" ? weekRangeLabel(key) : "",
        count: 1,
      });
    }
  }
  return [...groups.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

export default function DailyPeriodIndexClient({ kind }: { kind: "week" | "month" }) {
  const [attempt, setAttempt] = useState(0);
  const [listView, setListView] = useState<ListState>({ status: "loading" });

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
        if (!controller.signal.aborted)
          setListView({ status: "ready", groups: groupByPeriod(items, kind) });
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
  }, [attempt, kind]);

  return (
    <div aria-live="polite" aria-busy={listView.status === "loading"}>
      {listView.status === "loading" && (
        <p className={featuredStyles.state} role="status">一覧を読み込んでいます…</p>
      )}

      {listView.status === "empty" && (
        <p className={featuredStyles.state} role="status">公開済みのアーカイブはまだありません。</p>
      )}

      {listView.status === "error" && (
        <div className={featuredStyles.state} role="alert">
          <p>一覧を取得できませんでした。</p>
          <button className={featuredStyles.retry} type="button" onClick={() => setAttempt((value) => value + 1)}>
            再読み込み
          </button>
        </div>
      )}

      {listView.status === "ready" && (
        <ol className={styles.archiveList}>
          {listView.groups.map((group) => (
            <li key={group.key}>
              <Link
                className={styles.archiveItem}
                href={`/daily-analysis/archive/${kind === "week" ? "weekly" : "monthly"}/?${kind === "week" ? "week" : "month"}=${group.key}`}
              >
                <span className={styles.archiveTitle}>{group.title}</span>
                <span className={styles.archiveCompany}>
                  {group.detail ? `${group.detail}・` : ""}
                  {group.count}件の記事
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
