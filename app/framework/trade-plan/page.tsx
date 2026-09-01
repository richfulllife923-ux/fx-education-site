import { AlertTriangle, ClipboardCheck, Eye, Layers3, RefreshCw, Route, ShieldQuestion, Target } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { Callout, FlowChart } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Trade Plan | TUTTO Framework",
  description: "TUTTOにおけるTrade Planを、売買シグナルではなく観測された市場文脈を判断可能な計画へ整理する概念として説明する公式Documentation。",
  path: "/framework/trade-plan",
});

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Observed Context",
    description: "Trade Planは、市場が形成したStructure、Layer、STATEを観測した後に整理される計画です。観測そのものを置き換えるものではありません。",
  },
  {
    icon: ClipboardCheck,
    title: "Decision Plan",
    description: "観測された市場文脈を、人間が判断できる形へ整理します。TUTTOが判断を代行するものではありません。",
  },
  {
    icon: ShieldQuestion,
    title: "Not a Signal",
    description: "Trade Planは予測、売買シグナル、自動注文、利益保証ではありません。最終的なDecisionは利用者自身が行います。",
  },
];

const PLAN_TERMS = [
  {
    title: "Entry",
    description: "Trade Planを構成し得る計画要素のひとつです。今回の公開範囲では、具体的な条件、価格、数値、内部計算は扱いません。",
  },
  {
    title: "Stop",
    description: "Trade Plan上の管理概念です。Structural Invalidationと同一視せず、具体的な計算方法は公開しません。",
  },
  {
    title: "Target",
    description: "予測価格や保証された到達地点ではありません。Plan上のObservation Objectiveとして扱います。",
  },
  {
    title: "Invalidation",
    description: "市場構造として成立していた根拠が失われることを整理する境界です。売買命令ではありません。",
  },
];

const INTERNAL_BOUNDARIES = [
  "Geometry Candidate values",
  "Candidate ranking",
  "Acceptance calculation",
  "Validation thresholds",
  "internal scoring",
  "Engine implementation",
  "MQL5 implementation",
  "DTO internals",
  "internal state transition tables",
  "internal target calculation",
];

const NOT_A_SIGNAL = ["Prediction", "Signal", "Automatic Order", "Guaranteed Outcome"];

export default function TradePlanPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Trade Plan", path: "/framework/trade-plan" }]} />

      <section className="container-page pt-6">
        <div className="max-w-4xl">
          <p className="eyebrow"><Route size={14} strokeWidth={1.8} aria-hidden="true" /> Trade Plan</p>
          <h1 className="font-display text-4xl font-black leading-tight text-text-primary sm:text-5xl">
            観測された市場文脈を、判断可能な計画へ整理する。
          </h1>
          <p className="mt-6 text-[15px] leading-8 text-text-secondary sm:text-base">
            TUTTOにおけるTrade Planは、売買シグナルではありません。Structure、Market Layer、STATEを通じて観測された市場文脈を、人間がDecisionへ進むための計画として整理する概念です。
          </p>
        </div>
      </section>

      <section className="container-page mt-12">
        <Callout title="TRADE PLAN = STRUCTURED DECISION PLAN BASED ON OBSERVED MARKET CONTEXT">
          Trade Planは、観測された市場文脈を、判断可能な計画として整理したものです。Structureを作り直すものでも、STATEを生成するものでも、市場を予測するものでもありません。
        </Callout>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Why Trade Plan Exists"
          title="Observationを、判断へ進めるための形にする"
          description="観測だけでは、次に何を確認し、どの条件で計画を見直すのかが曖昧になることがあります。Trade Planは、観測された文脈を人間が扱える計画として整理するためにあります。"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PRINCIPLES.map((principle) => {
            const Icon = principle.icon;
            return (
              <article key={principle.title} className="card flex h-full flex-col gap-4 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-button border border-primary bg-[rgba(59,130,246,0.10)] text-primary">
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-text-primary">{principle.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">{principle.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Observation Before Plan"
          title="Trade Planは、上流概念を定義しない"
          description="Trade PlanがStructure、Layer Ownership、STATEを作るのではありません。先に観測された市場文脈があり、その後にDecisionとPlanが整理されます。"
        />
        <div className="card p-6 sm:p-8">
          <FlowChart
            steps={[
              { label: "Structure" },
              { label: "Layer Ownership" },
              { label: "Observation" },
              { label: "STATE" },
              { label: "Decision" },
              { label: "Trade Plan" },
            ]}
          />
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Trade Plan Is Not a Signal"
          title="Trade Planは、売買の答えではない"
          description="TUTTOはObservationとDecisionを分けます。Trade Planは判断材料を整理するものであり、実行指示や保証された結果ではありません。"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {NOT_A_SIGNAL.map((item) => (
            <div key={item} className="card flex items-center gap-3 p-5">
              <AlertTriangle className="shrink-0 text-warning" size={17} strokeWidth={1.8} aria-hidden="true" />
              <p className="text-sm font-bold text-text-primary">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Plan Components"
          title="計画要素は、市場の確定ではない"
          description="Entry、Stop、Target、Invalidationという言葉に触れる場合でも、それらはTrade Planを構成し得る概念境界です。具体的な売買条件としては公開しません。"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {PLAN_TERMS.map((item) => (
            <article key={item.title} className="card p-6">
              <h2 className="text-base font-bold text-text-primary">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Structural Invalidation Boundary"
          title="Structural InvalidationとStopを同一視しない"
          description="Structural Invalidationは、市場構造として成立していた根拠が失われることです。StopはTrade Plan上の管理概念であり、今回の公開範囲では具体的な価格計算や内部条件を扱いません。"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="card border-primary p-6">
            <p className="text-sm font-bold text-text-primary">Structural Invalidation</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">市場構造として成立していた根拠が失われること。Structure側の観測境界です。</p>
          </div>
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Stop</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">Trade Plan上の管理概念。Structural Invalidationそのものと同一ではありません。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Target Boundary"
          title="Targetは、未来の保証ではない"
          description="Targetに言及する場合、それは予測価格や必ず到達する地点ではありません。Plan上のObservation Objectiveとして扱います。"
        />
        <div className="card p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-button border border-primary bg-[rgba(59,130,246,0.10)] text-primary">
              <Target size={20} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <p className="text-sm leading-8 text-text-secondary">
              Targetは、市場がそこへ進むことを保証する言葉ではありません。TUTTOでは、観測された文脈の中で何を確認対象にするのかを整理するための概念として扱います。
            </p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Multi-Layer Context"
          title="複数Layerの文脈は同時に存在できる"
          description="Execution、Swing、Structure、Macroは、それぞれ異なるObservation ContextやSTATEを持つことがあります。それは自動的な矛盾ではありません。"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {["Execution", "Swing", "Structure", "Macro"].map((layer) => (
            <div key={layer} className="card p-5">
              <p className="text-sm font-bold text-text-primary">{layer}</p>
              <p className="mt-2 text-xs leading-6 text-text-secondary">独立した観測責任を持つLayer</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-8 text-text-secondary">
          大きな表示時間足が常に正しい、Macroが常に絶対的な権威である、という説明は採用しません。Layerは優劣ではなく、Observation Responsibilityを整理するための概念です。
        </p>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Display Change / Market Change"
          title="表示変更だけで、計画の根拠は変わらない"
          description="表示時間足の変更、redraw、reload、Indicator reattach、terminal restart、UI refreshだけでは、Trade Planの構造的根拠が変化したとは扱いません。"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Display Change</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">画面、view、表示解像度の変更。これだけではMarket Changeではありません。</p>
          </div>
          <RefreshCw className="mx-auto text-primary" size={22} strokeWidth={1.8} aria-hidden="true" />
          <div className="card border-primary p-6">
            <p className="text-sm font-bold text-text-primary">Market Change</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">市場側の観測変化によって、StructureやSTATEの扱われ方に変化が生じること。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Decision Boundary"
          title="最後の判断は、人間が行う"
          description="Trade Planは判断材料を整理しますが、判断を代行しません。観測、文脈、Decision、Planの順序を維持することで、TUTTOはブラックボックス化を避けます。"
        />
        <div className="card p-6 sm:p-8">
          <FlowChart
            steps={[
              { label: "Observation" },
              { label: "Context" },
              { label: "Decision" },
              { label: "Plan" },
            ]}
          />
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Theory Boundary"
          title="このページで公開しないもの"
          description="Trade Planを内部仕様や自動売買ロジックとして誤解させないため、以下は公開しません。"
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {INTERNAL_BOUNDARIES.map((item) => (
            <div key={item} className="card flex items-start gap-3 px-5 py-4 text-sm font-semibold text-text-primary">
              <Layers3 className="mt-px shrink-0 text-primary" size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <Callout title="Trade Plan is not a guarantee">
          市場に絶対はありません。Trade Planは利益を保証するものではなく、自動的な注文命令でもありません。利用する場合も、リスク、条件、文脈を確認し、最終的な判断は自分自身で行う必要があります。
        </Callout>
      </section>
    </div>
  );
}
