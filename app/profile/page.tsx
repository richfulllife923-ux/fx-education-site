import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description: "TUTTOプロジェクトの概要です。",
  path: "/profile",
});

export default function ProfilePage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "About", path: "/profile" }]} />
      <section className="container-page pt-6">
        <SectionHeading eyebrow="About" title="TUTTO Framework" description="TUTTOは、MT5上で市場構造を観測し、トレーダーが自分の判断を組み立てるための可視化フレームワークとして開発されています。" />
        <div className="card max-w-3xl p-6 sm:p-8">
          <p className="text-sm leading-8 text-text-secondary">
            価格予測ではなく、構造認識と観測を重視します。公開サイトでは、理論の全てを開示するのではなく、利用者が思想と開発状況を理解できる範囲で情報を整理します。
          </p>
        </div>
      </section>
    </div>
  );
}
