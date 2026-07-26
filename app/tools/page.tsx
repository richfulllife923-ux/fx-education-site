import { buildMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { PrincipleCard } from "@/components/Diagram";
import { Calculator, NotebookPen, LineChart, Bell } from "lucide-react";

export const metadata = buildMetadata({
  title: "おすすめツール｜資金管理と分析を助ける定番アイテム",
  description: "ロット計算機、取引記録ツール、チャート分析環境、経済指標カレンダーなど、FX学習・資金管理に役立つツールのカテゴリを紹介します。",
  path: "/tools",
});

const TOOLS = [
  {
    icon: Calculator,
    title: "ロット計算ツール",
    description: "許容損失とストップ幅から、適切なロット数を自動計算するツール。感覚でのロット決定を防ぎます。",
  },
  {
    icon: NotebookPen,
    title: "取引記録（トレードジャーナル）",
    description: "エントリー根拠・結果・反省点を記録するツール。感情に流されたトレードを客観視するために欠かせません。",
  },
  {
    icon: LineChart,
    title: "チャート分析プラットフォーム",
    description: "マルチタイムフレーム表示やフィボナッチ描画に対応したチャートツール。TUTTO理論の分析にも活用できます。",
  },
  {
    icon: Bell,
    title: "経済指標カレンダー",
    description: "重要な経済指標の発表日時を確認できるツール。指標前後のボラティリティ上昇に備えるために活用します。",
  },
];

export default function ToolsPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "おすすめツール", path: "/tools" }]} />

      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Toolkit"
          title="資金管理と分析を助けるツール"
          description="ここでは特定の商品名ではなく、資金管理・分析において「何を目的に」ツールを選ぶべきかをカテゴリ別に紹介します。"
        />
      </section>

      <section className="container-page mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <PrincipleCard key={t.title} {...t} />
        ))}
      </section>
    </div>
  );
}
