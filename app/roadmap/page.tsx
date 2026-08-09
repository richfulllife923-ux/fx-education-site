import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roadmap",
  description: "TUTTO FrameworkとIndicatorの公開開発状況をまとめます。",
  path: "/roadmap",
});

const ITEMS = [
  { label: "Brand Foundation", state: "Completed", text: "TUTTO Frameworkのブランド、色、用語、公開表現を整理。" },
  { label: "Framework Foundation", state: "In progress", text: "Philosophy、Structure Theory、Market Layer、STATE、Trade Planの入口を整備。" },
  { label: "Indicator", state: "In development", text: "MT5上で市場構造を可視化するIndicatorを段階的に構築中。" },
  { label: "Research", state: "Preparing", text: "市場分析とケーススタディの公開フォーマットを準備中。" },
];

export default function RoadmapPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Roadmap", path: "/roadmap" }]} />
      <section className="container-page pt-6">
        <SectionHeading eyebrow="Roadmap" title="開発状況" description="TUTTO Frameworkの現在地を、公開可能な範囲で整理します。" />
      </section>
      <section className="container-page mt-12 space-y-4">
        {ITEMS.map((item) => (
          <div key={item.label} className="card grid gap-3 p-5 sm:grid-cols-[180px_160px_1fr] sm:items-center">
            <p className="font-display font-bold text-text-primary">{item.label}</p>
            <span className="badge w-fit">{item.state}</span>
            <p className="text-sm leading-7 text-text-secondary">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}