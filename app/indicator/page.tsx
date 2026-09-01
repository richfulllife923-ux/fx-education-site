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
    </div>
  );
}
