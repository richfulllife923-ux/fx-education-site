import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { ComparisonTable, Callout } from "@/components/Diagram";

export const metadata = buildMetadata({
  title: "フィボナッチ講座｜比率ではなく市場構造として読む",
  description:
    "0.236から4.236まで、フィボナッチ比率を単なる数値ではなく市場構造として解説。TUTTO理論との違いも整理します。",
  path: "/fibonacci",
});

const RATIOS: { value: string; role: string }[] = [
  { value: "0.236", role: "浅い調整。強いトレンド継続時に見られやすい水準" },
  { value: "0.382", role: "標準的な押し目・戻りの水準" },
  { value: "0.5", role: "フィボナッチ比率ではないが、心理的な折り返し地点として意識されやすい" },
  { value: "0.618", role: "「黄金比」と呼ばれる、反応が出やすいとされる代表的な水準" },
  { value: "0.705", role: "0.618と0.786の中間帯。構造の境目として補助的に使われる水準" },
  { value: "0.786", role: "深い調整。トレンド転換の可能性も意識される水準" },
  { value: "1", role: "直前の値幅を100%再現した水準" },
  { value: "1.382", role: "延長１段階目の利益確定目安" },
  { value: "1.618", role: "延長の代表的な水準。最初のTP目安として使われやすい" },
  { value: "2.33", role: "延長２段階目の目安として補助的に使用" },
  { value: "2.618", role: "延長の中でも強く意識されやすい水準" },
  { value: "4.236", role: "大幅な延長。長期的な視点での目標水準" },
];

export default function FibonacciPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "フィボナッチ", path: "/fibonacci" }]} />

      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Fibonacci as Structure"
          title="フィボナッチは「比率」ではなく「市場構造」として読む"
          description="フィボナッチ比率を暗記するだけでは、実践では機能しません。値動きがどの構造の中で、その比率に反応しているのかを合わせて見ることが重要です。"
        />
      </section>

      <section className="container-page mt-4">
        <ComparisonTable headers={["水準", "構造上の役割（目安）"]} rows={RATIOS.map((r) => [r.value, r.role])} />
        <p className="mt-4 text-xs text-muted">
          ※ 各水準の反応度は相場状況によって大きく異なります。単独での使用ではなく、他の分析と組み合わせてご活用ください。
        </p>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Fib vs TUTTO" title="TUTTO理論との違い" />
        <div className="card p-6 text-sm leading-relaxed text-navy-700">
          <p>
            フィボナッチ単体の分析は「価格が反応しやすい水準」を示すものですが、
            <Link href="/tutto-theory" className="font-semibold text-gold-600 underline underline-offset-2">
              TUTTO理論
            </Link>
            では、フィボナッチ構造をSTATE3として位置づけ、市場の受容度（STATE1）や幾何学的評価（STATE2）と
            組み合わせて検証する点が異なります。フィボナッチはTUTTO理論の一部を構成する要素の一つです。
          </p>
        </div>
      </section>

      <section className="container-page mt-16">
        <Callout tone="danger" title="ご利用にあたって">
          フィボナッチ分析は将来の値動きを保証するものではありません。あくまで確率的な目安として、資金管理と併用してください。
        </Callout>
      </section>
    </div>
  );
}
