import Breadcrumb from "@/components/Breadcrumb";
import { Callout } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "市場構造",
  description: "TUTTOにおける価格帯の見方を、公開可能な抽象レベルで紹介します。",
  path: "/fibonacci",
});

const ITEMS = [
  { title: "価格帯", text: "数値そのものではなく、市場参加者がその帯をどう扱ったかを観測します。" },
  { title: "反応", text: "到達、保持、拒否、通過といった反応を、後から説明できる形で整理します。" },
  { title: "構造", text: "単独の点ではなく、波、押し戻し、維持の流れを含めて判断材料にします。" },
];

export default function FibonacciPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "市場構造", path: "/fibonacci" }]} />
      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Structure"
          title="数値ではなく、市場構造として見る"
          description="TUTTOでは、価格帯を単なる暗記対象として扱いません。市場がどの帯を採用し、どの帯を拒否したのかを観測することを重視します。"
        />
        <Callout tone="warning" title="公開範囲について">
          一般公開サイトでは、独自のGeometry値、内部スコア、判定条件は掲載しません。ここでは考え方の概要だけを説明します。
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
