import Breadcrumb from "@/components/Breadcrumb";
import { Callout } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "資金管理",
  description: "TUTTOが重視する生存優先の資金管理思想を紹介します。",
  path: "/fund-management",
});

export default function FundManagementPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "資金管理", path: "/fund-management" }]} />
      <section className="container-page pt-6">
        <SectionHeading eyebrow="Risk" title="資金管理" description="TUTTOでは、勝つための前に、市場に残り続けるための資金管理を重視します。" />
        <Callout tone="warning" title="重要">
          本ページは教育目的です。具体的な投資助言や利益保証ではありません。
        </Callout>
      </section>
      <section className="container-page mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {["損失上限を決める", "連敗時に縮小する", "荒い相場では無理をしない"].map((item) => (
          <div key={item} className="card p-6">
            <h2 className="font-display text-lg font-bold text-text-primary">{item}</h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary">判断の質が落ちる局面を避け、観測を続けられる状態を保ちます。</p>
          </div>
        ))}
      </section>
    </div>
  );
}
