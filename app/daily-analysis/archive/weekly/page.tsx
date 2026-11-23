import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import DailyPeriodPageClient from "@/components/stock-analysis/DailyPeriodPageClient";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "週刊市場分析",
  description: "毎日のTUTTO市場分析を週ごとにまとめた一覧です。週を選ぶと、その週の記事一覧を表示します。",
  path: "/daily-analysis/archive/weekly",
});

export default function WeeklyArchiveIndexPage() {
  return (
    <div className="pb-24">
      <Breadcrumb
        items={[
          { name: "過去のTUTTO市場分析", path: "/daily-analysis/archive" },
          { name: "週刊市場分析", path: "/daily-analysis/archive/weekly" },
        ]}
      />
      <section className="container-page pt-6">
        <Suspense fallback={<p role="status">一覧を読み込んでいます…</p>}>
          <DailyPeriodPageClient kind="week" />
        </Suspense>
      </section>
    </div>
  );
}
