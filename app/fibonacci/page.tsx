import Breadcrumb from "@/components/Breadcrumb";
import { Callout } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Structure Theory",
  description: "TUTTO Frameworkにおける構造の見方を、公開可能な抽象レベルで紹介します。",
  path: "/fibonacci",
});

const ITEMS = [
  { title: "構造起点", text: "観測する構造がどこから始まったのかを整理するための基準です。" },
  { title: "構造認証点", text: "市場がその構造を扱い始めたかどうかを確認するための境界です。" },
  { title: "構造候補", text: "採用、拒否、通過、遷移のいずれにもなり得る観測対象です。" },
];

export default function StructurePage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Structure Theory", path: "/fibonacci" }]} />
      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Structure Theory"
          title="構造として市場を見る"
          description="TUTTO Frameworkでは、価格帯を単なる目標値として扱いません。構造起点、構造認証点、構造候補を分け、市場がどの構造を受容し、どの構造を拒否したのかを観測します。"
        />
        <Callout tone="warning" title="公開範囲について">
          一般公開サイトでは、独自の内部数値、スコア、判定条件は掲載しません。ここでは構造理論の概要だけを説明します。
        </Callout>
      </section>
      <section className="container-page mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.title} className="card p-6">
            <h2 className="font-display text-lg font-bold text-text-primary">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}