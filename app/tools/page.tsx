import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "開発状況",
  description: "TUTTO Indicatorと関連ツールの開発状況を公開可能な範囲でまとめます。",
  path: "/tools",
});

const ROADMAP = [
  { label: "Architecture", state: "Completed", text: "観測エンジンと表示レイヤーの責任分離を整理。" },
  { label: "Indicator", state: "In development", text: "MT5上で構造を可視化するための実装を段階的に構築中。" },
  { label: "Public release", state: "Coming soon", text: "検証とドキュメント整備後に公開予定。" },
];

export default function ToolsPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "開発状況", path: "/tools" }]} />
      <section className="container-page pt-6">
        <SectionHeading eyebrow="Development" title="開発状況" description="TUTTOは現在、Market Geometry Observation Frameworkとして段階的に開発中です。" />
      </section>
      <section className="container-page mt-12 space-y-4">
        {ROADMAP.map((item) => (
          <div key={item.label} className="card grid gap-3 p-5 sm:grid-cols-[160px_160px_1fr] sm:items-center">
            <p className="font-display font-bold text-text-primary">{item.label}</p>
            <span className="badge w-fit">{item.state}</span>
            <p className="text-sm leading-7 text-text-secondary">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
