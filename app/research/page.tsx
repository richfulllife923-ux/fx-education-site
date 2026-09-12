import { FileSearch, Microscope, NotebookText, Radar } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { PrincipleCard } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Research",
  description: "TUTTO Frameworkの市場分析とケーススタディの入口ページです。",
  path: "/research",
});

const AREAS = [
  {
    icon: FileSearch,
    title: "Market Analysis",
    description: "公開可能な範囲で、市場構造がどう観測されたかを整理します。",
  },
  {
    icon: NotebookText,
    title: "Case Study",
    description: "実例を使い、構造受容、構造遷移、構造無効化の見方を学べる形式にします。",
  },
  {
    icon: Microscope,
    title: "Observation Notes",
    description: "検証前の断定ではなく、観測メモとして積み上げます。",
  },
];

const EVIDENCE_FLOW = [
  { label: "PRE-OBSERVATION", description: "先出し観測" },
  { label: "MARKET REACTION", description: "市場反応" },
  { label: "RUNTIME EVIDENCE", description: "経過記録" },
  { label: "ANSWER CHECK", description: "答え合わせ" },
  { label: "STRUCTURE VERIFICATION", description: "構造検証" },
];

export default function ResearchPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Research", path: "/research" }]} />
      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Research"
          title="市場分析・ケーススタディ"
          description="Researchは、TUTTO Frameworkを使って市場構造を読むための入口です。内部条件は公開せず、公開可能な観測結果と考え方だけを整理します。"
        />
      </section>
      <section className="container-page mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {AREAS.map((area) => (
          <PrincipleCard key={area.title} icon={area.icon} title={area.title} description={area.description} />
        ))}
      </section>

      <section className="mt-16 border-y border-border bg-surface py-16 sm:py-24">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <div>
              <p className="eyebrow"><Radar size={14} strokeWidth={1.8} /> OBSERVATION → EVIDENCE</p>
              <h2 className="max-w-2xl text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
                先に観測し、<br />市場の反応を後から検証する。
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-8 text-text-secondary">
                <p>
                  TUTTOは、市場が動いた後に「ここが重要だった」と説明するためのFrameworkではありません。
                </p>
                <p>
                  市場の結果がまだ分からない段階でStructureやGeometryの観測ポイントを記録し、その後に市場が実際にどう扱ったかを確認します。
                </p>
                <p>
                  未来価格を保証するのではなく、市場がどの構造を採用したかを観測・検証します。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
              {EVIDENCE_FLOW.map((step, index) => (
                <div key={step.label} className="card relative p-4 sm:min-h-[150px]">
                  <span className="font-display text-xs font-black text-primary">0{index + 1}</span>
                  <h3 className="mt-4 text-sm font-bold leading-6 text-text-primary">{step.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
