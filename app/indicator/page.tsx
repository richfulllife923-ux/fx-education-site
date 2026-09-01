import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { Callout } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Indicator",
  description: "TUTTO Indicatorの公開準備ページです。",
  path: "/indicator",
});

const PARAMETERS = [
  {
    title: "ENTRY",
    subtitle: "中長期エントリーの発生確率",
    description: "TUTTOが中長期の市場構造をもとに、エントリー条件が整う可能性を表示します。",
    note: "表示される確率は、現在の市場状態に対するTUTTO内部評価の目安です。",
  },
  {
    title: "MICRO",
    subtitle: "短期エントリーの発生確率",
    description: "短期の市場構造を観測し、短期エントリー条件が整う可能性を表示します。",
    note: "ENTRYよりも短い時間軸の変化を確認するための表示です。",
  },
  {
    title: "CNN",
    subtitle: "恐怖指数",
    description: "市場全体のFear / Greed環境を確認するための指標です。",
    note: "現在の市場心理が、恐怖側にあるのか、強気側にあるのかを補助的に確認できます。",
  },
];

export default function IndicatorPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Indicator", path: "/indicator" }]} />
      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Coming Soon"
          title="TUTTO Indicator"
          description="TUTTO Indicatorは、TUTTO FrameworkをMT5上で可視化するために開発中です。"
        />
        <Callout tone="primary" title="公開準備中">
          まだ購入ボタンや配布導線は追加しません。検証、ドキュメント、公開準備が整った段階で案内します。
        </Callout>
        <div className="mt-6">
          <Link href="/indicator/install" className="btn-ghost">
            MT5へのインストール方法
          </Link>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Parameters"
          title="使い方 / Parameters"
          description="TUTTO Indicatorで表示される主要な確認項目を、公開可能な範囲で整理します。"
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {PARAMETERS.map((parameter) => (
            <div key={parameter.title} className="card flex h-full flex-col p-6">
              <p className="font-display text-xs font-black uppercase tracking-[0.16em] text-primary">{parameter.title}</p>
              <h3 className="mt-3 text-lg font-bold text-text-primary">{parameter.subtitle}</h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{parameter.description}</p>
              <p className="mt-4 border-t border-border pt-4 text-sm leading-7 text-text-secondary">{parameter.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-7 text-text-secondary">
          ENTRY / MICROの確率表示は、将来の値動きや利益を保証するものではありません。TUTTO Indicatorによる市場構造の観測結果を確認するための補助表示です。
        </p>
      </section>
    </div>
  );
}
