import { ArrowDown, BookOpen, Brain, CircleDot, Eye, GraduationCap, GitBranch, ShieldQuestion } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { Callout, FlowChart } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Philosophy | TUTTO Framework",
  description: "TUTTOが市場をどのような原則で観測し、構造・受容・拒否・判断を整理するFrameworkなのかを説明する公式Documentation。",
  path: "/framework/philosophy",
});

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Observation Before Prediction",
    description: "TUTTOは未来を断定するためのFrameworkではありません。市場が形成した構造と、その構造に対する実際の反応を観測します。",
  },
  {
    icon: GitBranch,
    title: "Structure Before Signal",
    description: "最初に見るものはSignalではなくStructureです。Structure、Observation、Acceptance / Rejection、Decisionの順序を重視します。",
  },
  {
    icon: CircleDot,
    title: "Acceptance / Rejection",
    description: "市場が何を受け入れ、何を拒否したのかを分けて整理します。反応を単なる上下ではなく、構造に対する扱いとして観測します。",
  },
  {
    icon: ShieldQuestion,
    title: "Uncertainty",
    description: "市場に絶対はありません。不確実性を欠点として隠すのではなく、Frameworkの前提として扱います。",
  },
  {
    icon: Brain,
    title: "Self Decision",
    description: "TUTTOは判断を代行しません。FrameworkとIndicatorは、考えるための情報を整理する道具です。最後のDecisionは利用者自身が行います。",
  },
  {
    icon: GraduationCap,
    title: "Learning Philosophy",
    description: "答えを受け取ることよりも、なぜその判断に至るのかを理解できることを重視します。",
  },
];

const OBSERVATION_TARGETS = ["Structure", "Acceptance", "Rejection", "Transition", "Current State"];

export default function FrameworkPhilosophyPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Framework", path: "/framework" }, { name: "Philosophy", path: "/framework/philosophy" }]} />

      <section className="container-page pt-6">
        <div className="max-w-4xl">
          <p className="eyebrow"><BookOpen size={14} strokeWidth={1.8} /> Framework Philosophy</p>
          <h1 className="font-display text-4xl font-black leading-tight text-text-primary sm:text-5xl">市場をどう見るか。</h1>
          <p className="mt-6 text-[15px] leading-8 text-text-secondary sm:text-base">
            TUTTOは未来を断定するためのFrameworkではありません。市場が形成した構造と、その構造に対する実際の反応を観測し、理解するためのFrameworkです。
          </p>
        </div>
      </section>

      <section className="container-page mt-12">
        <Callout title="Manifestoとの役割の違い">
          Manifestoは、なぜTUTTOが存在するのかを示す思想ページです。Philosophyは、TUTTOが市場をどのような原則で理解するのかをDocumentationとして整理します。
        </Callout>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Principles" title="Frameworkの基本原則" description="予測を事実のように扱わず、現在確認できる市場情報を順序立てて整理します。" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((principle) => (
            <article key={principle.title} className="card flex h-full flex-col gap-4 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-button border border-primary bg-[rgba(59,130,246,0.10)] text-primary">
                <principle.icon size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-text-primary">{principle.title}</h2>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{principle.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Observation" title="Observationは、判断そのものではない" description="TUTTOにおけるObservationは、単にチャートを見ることではありません。判断の前に、何が起きたのかを分けて扱うための過程です。" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Observation Targets</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {OBSERVATION_TARGETS.map((target) => (
                <span key={target} className="badge">{target}</span>
              ))}
            </div>
          </div>
          <div>
            <FlowChart
              steps={[
                { label: "Market" },
                { label: "Structure" },
                { label: "Observation" },
                { label: "Acceptance / Rejection" },
                { label: "Decision" },
              ]}
            />
            <p className="mt-5 text-sm leading-8 text-text-secondary">
              ObservationとDecisionを同一視しないことが重要です。TUTTOは市場の反応を整理しますが、最終的なDecisionを自動的に置き換えるものではありません。
            </p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Structure" title="Structure Before Signal" description="SignalからTradeへ直行するのではなく、市場がどのStructureをどう扱ったのかを確認します。" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">単純化しすぎた流れ</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">SignalからTradeへ進むだけでは、なぜその判断に至ったのかが残りにくくなります。</p>
          </div>
          <ArrowDown className="mx-auto text-primary lg:-rotate-90" size={22} strokeWidth={1.8} aria-hidden="true" />
          <div className="card border-primary p-6">
            <p className="text-sm font-bold text-text-primary">TUTTOが重視する流れ</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">Structure、Observation、Acceptance / Rejection、Decisionの順序で、判断理由を説明できる状態へ整理します。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Uncertainty" title="不確実性を前提にする" description="不確実性は排除すべき欠陥ではなく、市場を扱ううえでの前提です。" />
        <div className="card p-6 sm:p-8">
          <p className="max-w-3xl text-sm leading-8 text-text-secondary">
            TUTTOは、絶対、確実、必ずといった判断をFrameworkの前提にしません。不確実性の中で、現在確認できる市場情報を整理し、判断に必要な材料を見える状態へ近づけます。
          </p>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Next Documentation" title="次に読むページ" description="Structure Theoryは次のDocumentationとして準備します。まだ公開routeは作成しないため、ここでは非リンクの案内に留めます。" />
        <div className="card border-primary p-6">
          <p className="text-sm font-bold text-text-primary">Next: Structure Theory</p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">次の段階では、Structure、Acceptance、Rejectionをより具体的に整理します。</p>
        </div>
      </section>
    </div>
  );
}