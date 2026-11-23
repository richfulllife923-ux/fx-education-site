import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import DailyArchiveClient from "@/components/stock-analysis/DailyArchiveClient";
import ArchiveNavCards from "@/components/stock-analysis/ArchiveNavCards";
import navStyles from "@/components/stock-analysis/ArchiveNavCards.module.css";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "過去のTUTTO市場分析",
  description: "これまでに公開した毎日のTUTTO市場分析のアーカイブです。日付順に過去の分析を読み返せます。",
  path: "/daily-analysis/archive",
});

export default function DailyAnalysisArchivePage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "過去のTUTTO市場分析", path: "/daily-analysis/archive" }]} />
      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="TUTTO DAILY MARKET ANALYSIS"
          title="過去のTUTTO市場分析"
          description="これまでに公開した毎日の市場分析の一覧です。記事を選ぶと全文を表示します。表示内容は公開時点の観測結果であり、売買指示や投資助言ではありません。"
        />
        <ArchiveNavCards />
        <h2 className={navStyles.resultsHeading}>過去の結果</h2>
        <DailyArchiveClient groupByMonth pageSize={10} />
      </section>
    </div>
  );
}
