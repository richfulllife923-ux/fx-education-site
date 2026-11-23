import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import DailyPeriodPageClient from "@/components/stock-analysis/DailyPeriodPageClient";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "月間市場分析",
  description: "毎日のTUTTO市場分析を月ごとにまとめた一覧です。月を選ぶと、その月の記事一覧を表示します。",
  path: "/daily-analysis/archive/monthly",
});

export default function MonthlyArchiveIndexPage() {
  return (
    <div className="pb-24">
      <Breadcrumb
        items={[
          { name: "過去のTUTTO市場分析", path: "/daily-analysis/archive" },
          { name: "月間市場分析", path: "/daily-analysis/archive/monthly" },
        ]}
      />
      <section className="container-page pt-6">
        <Suspense fallback={<p role="status">一覧を読み込んでいます…</p>}>
          <DailyPeriodPageClient kind="month" />
        </Suspense>
      </section>
    </div>
  );
}
