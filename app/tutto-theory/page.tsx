import { CheckCircle2 } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { Callout, FlowChart } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "TUTTOとは",
  description: "TUTTOは、市場構造の採用と拒否を観測するためのMarket Geometry Observation Frameworkです。",
  path: "/tutto-theory",
});

const PRINCIPLES = [
  "予測ではなく観測を目的にする",
  "価格そのものを最優先の情報源にする",
  "内部条件を公開せず、公開サイトでは抽象概念に留める",
];

export default function TuttoTheoryPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "TUTTOとは", path: "/tutto-theory" }]} />
      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Framework"
          title="TUTTOとは"
          description="TUTTOは、売買シグナルを出すための一般的なインジケーターではありません。市場がどの構造を受け入れ、どの構造を拒否したのかを整理するための観測フレームワークです。"
        />
        <Callout tone="primary" title="公開サイトで説明する範囲">
          このページでは、TUTTOの思想と使い方の方向性を説明します。独自パラメータ、内部判定式、閾値、無効化ロジックなどは公開しません。
        </Callout>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Process" title="観測の流れ" />
        <FlowChart
          steps={[
            { label: "価格", note: "チャートそのもの" },
            { label: "構造", note: "波と価格帯" },
            { label: "反応", note: "受容・拒否・通過" },
            { label: "計画", note: "人間が判断する材料" },
          ]}
        />
      </section>

      <section className="border-y border-border bg-surface py-16 mt-16">
        <div className="container-page">
          <SectionHeading eyebrow="Principles" title="TUTTOの原則" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {PRINCIPLES.map((item) => (
              <div key={item} className="card flex items-start gap-3 p-5">
                <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={20} strokeWidth={1.8} />
                <p className="text-sm leading-7 text-text-secondary">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
