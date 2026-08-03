import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "基礎知識",
  description: "TUTTOを理解する前提となるチャートとリスクの基礎を紹介します。",
  path: "/fx-basics",
});

const ITEMS = ["ローソク足", "時間軸", "スプレッド", "リスク管理", "検証"].map((title) => ({ title }));

export default function FxBasicsPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "基礎知識", path: "/fx-basics" }]} />
      <section className="container-page pt-6">
        <SectionHeading eyebrow="Basics" title="基礎知識" description="TUTTOを使う前に、チャート、時間軸、リスクを落ち着いて確認できることが大切です。" />
      </section>
      <section className="container-page mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {ITEMS.map((item) => (
          <div key={item.title} className="card p-5">
            <p className="font-display font-bold text-text-primary">{item.title}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
