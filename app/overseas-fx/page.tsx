import Breadcrumb from "@/components/Breadcrumb";
import { Callout } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "取引環境",
  description: "取引環境を選ぶ際に確認したいリスクと運用条件を整理します。",
  path: "/overseas-fx",
});

export default function OverseasFxPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "取引環境", path: "/overseas-fx" }]} />
      <section className="container-page pt-6">
        <SectionHeading eyebrow="Environment" title="取引環境" description="約定、コスト、入出金、規約、サポートを含めて、観測と検証を続けられる環境かを確認します。" />
        <Callout tone="danger" title="注意">
          取引環境の選択はリスクを伴います。条件だけで判断せず、透明性と自分の運用ルールを確認してください。
        </Callout>
      </section>
    </div>
  );
}
