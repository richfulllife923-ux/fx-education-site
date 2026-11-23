"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SectionHeading from "@/components/SectionHeading";
import DailyArchiveClient from "@/components/stock-analysis/DailyArchiveClient";
import DailyPeriodIndexClient from "@/components/stock-analysis/DailyPeriodIndexClient";
import {
  isMonthKey,
  isWeekKey,
  monthLabel,
  monthRange,
  weekLabel,
  weekRange,
} from "@/lib/archive-periods";
import styles from "./DailyArchiveClient.module.css";

const DISCLAIMER =
  "表示内容は公開時点の観測結果であり、売買指示や投資助言ではありません。記事を選ぶと全文を表示します。";

export default function DailyPeriodPageClient({ kind }: { kind: "week" | "month" }) {
  const searchParams = useSearchParams();
  const param = searchParams.get(kind === "week" ? "week" : "month");
  const valid = param !== null && (kind === "week" ? isWeekKey(param) : isMonthKey(param));

  if (!valid) {
    return (
      <>
        <SectionHeading
          eyebrow={kind === "week" ? "TUTTO WEEKLY MARKET ANALYSIS" : "TUTTO MONTHLY MARKET ANALYSIS"}
          title={kind === "week" ? "週刊市場分析" : "月間市場分析"}
          description={
            kind === "week"
              ? `毎日の市場分析を週（月曜始まり）ごとにまとめた一覧です。週を選ぶと、その週の記事一覧を表示します。${DISCLAIMER}`
              : `毎日の市場分析を月ごとにまとめた一覧です。月を選ぶと、その月の記事一覧を表示します。${DISCLAIMER}`
          }
        />
        <DailyPeriodIndexClient kind={kind} />
      </>
    );
  }

  const { start, end } = kind === "week" ? weekRange(param) : monthRange(param);
  const label = kind === "week" ? weekLabel(param) : monthLabel(param);

  return (
    <>
      <SectionHeading
        eyebrow={kind === "week" ? "TUTTO WEEKLY MARKET ANALYSIS" : "TUTTO MONTHLY MARKET ANALYSIS"}
        title={kind === "week" ? label : `${label}の市場分析`}
        description={`この${kind === "week" ? "週" : "月"}に公開した毎日の市場分析の一覧です。${DISCLAIMER}`}
      />
      <DailyArchiveClient periodStart={start} periodEnd={end} pageSize={10} />
      <p className={styles.backLink}>
        <Link href={`/daily-analysis/archive/${kind === "week" ? "weekly" : "monthly"}/`}>
          ← {kind === "week" ? "週の一覧" : "月の一覧"}へ戻る
        </Link>
      </p>
    </>
  );
}
