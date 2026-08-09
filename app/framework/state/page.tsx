import { AlertTriangle, Eye, GitBranch, RefreshCw, ShieldQuestion, SquareStack } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { Callout, FlowChart } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "STATE | TUTTO Framework",
  description: "TUTTOにおけるSTATEを、売買シグナルではなく観測されている市場構造の現在状態として整理する公式Documentation。",
  path: "/framework/state",
});

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Observed Market Condition",
    description: "STATEは、観測されている市場構造が現在どの状態として扱われているかを整理するための概念です。",
  },
  {
    icon: GitBranch,
    title: "Structure and STATE",
    description: "Structureは何を観測しているか。STATEはそのStructureが現在どの状態として観測されているかを扱います。",
  },
  {
    icon: ShieldQuestion,
    title: "Not a command",
    description: "STATEは売買方向、実行、利確、損切り、反転を直接命令するものではありません。",
  },
];

const TRANSITION_CONCEPTS = [
  { label: "維持", text: "観測状態が維持される可能性" },
  { label: "遷移", text: "市場側の反応によって状態が移る可能性" },
  { label: "回帰", text: "以前の扱われ方へ戻る可能性" },
  { label: "保留", text: "構造が保留または維持として観測される可能性" },
  { label: "無効化", text: "市場側の変化によって状態が無効化される可能性" },
];

const BOUNDARIES = [
  "内部分類や詳細名称の一覧",
  "詳細な遷移表",
  "内部ライフサイクル",
  "正確な発火条件",
  "売買方向や実行への対応付け",
  "固定比率によるPullback定義",
  "移動平均による状態決定",
];

export default function StatePage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Framework", path: "/framework" }, { name: "STATE", path: "/framework/state" }]} />

      <section className="container-page pt-6">
        <div className="max-w-4xl">
          <p className="eyebrow"><SquareStack size={14} strokeWidth={1.8} /> STATE</p>
          <h1 className="font-display text-4xl font-black leading-tight text-text-primary sm:text-5xl">
            市場構造の、現在の状態を観測する。
          </h1>
          <p className="mt-6 text-[15px] leading-8 text-text-secondary sm:text-base">
            TUTTOにおけるSTATEは、売買シグナルではありません。市場が形成したStructureが、現在どのような状態として観測されているかを整理するためのObservation Contextです。
          </p>
        </div>
      </section>

      <section className="container-page mt-12">
        <Callout title="STATE = OBSERVED MARKET CONDITION">
          STATEは、観測されている市場構造の現在状態を整理するための概念です。Structureを作り直すものでも、Layer Ownershipを決めるものでも、Trade Planを直接生成するものでもありません。
        </Callout>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Why STATE Exists"
          title="Structureだけでは、現在の扱われ方を説明しきれない"
          description="Structureは市場が形成した文脈です。一方で、そのStructureが現在受け入れられているのか、保留されているのか、無効化されつつあるのかは、別の観測対象として整理する必要があります。"
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
          eyebrow="Structure vs STATE"
          title="Structure IdentityとState Conditionを分ける"
          description="STATEが変化したからといって、Structure Identityそのものを毎回作り直すわけではありません。何を観測しているかと、現在どう扱われているかを分離します。"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Structure</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">何を観測しているか。市場が形成した構造、文脈、観測対象を整理します。</p>
          </div>
          <div className="card border-primary p-6">
            <p className="text-sm font-bold text-text-primary">STATE</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">そのStructureが現在どの状態として観測されているか。現在の扱われ方を整理します。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="State Observation"
          title="STATEはSignalではなく、Observation Contextである"
          description="STATEは判断の前に置かれる観測情報です。人間のDecisionを置き換えたり、実行指示を自動生成したりするものではありません。"
        />
        <div className="card p-6 sm:p-8">
          <FlowChart
            steps={[
              { label: "Market" },
              { label: "Structure" },
              { label: "Layer Ownership" },
              { label: "Observation" },
              { label: "STATE" },
              { label: "Decision" },
            ]}
          />
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Transition / Hold / Invalidation"
          title="STATEは固定された一本道ではない"
          description="市場側の観測変化によって、状態は維持、遷移、回帰、保留、無効化として整理されることがあります。ただし、詳細な条件や遷移表は公開しません。"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {TRANSITION_CONCEPTS.map((item) => (
            <div key={item.label} className="card p-5">
              <p className="text-sm font-bold text-text-primary">{item.label}</p>
              <p className="mt-2 text-xs leading-6 text-text-secondary">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Callout title="UI change is not invalidation">
            表示時間足の変更、redraw、page reload、Indicator reattach、terminal restart、UI refreshだけでSTATEが変わったとは扱いません。STATE変化には市場側の観測変化が必要です。
          </Callout>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Acceptance / Rejection"
          title="Acceptance / Rejectionは、STATEの観測材料になる"
          description="市場がStructureを受け入れたのか、拒否したのかはSTATEを整理するための材料になります。ただし、それは継続や反転を保証するものではありません。"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Acceptance</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">Structureが市場にどう扱われているかを観測する材料。未来の継続保証ではありません。</p>
          </div>
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Rejection</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">Structureに対する市場反応を整理する材料。未来の反転保証ではありません。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Multi-Layer STATE"
          title="Layerごとに異なるSTATEが同時に存在できる"
          description="Execution、Swing、Structure、Macroは、それぞれ異なるSTATEを持つことがあります。これは自動的なConflictやErrorではなく、LayerごとのObservation Responsibilityです。"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {["Execution", "Swing", "Structure", "Macro"].map((layer) => (
            <div key={layer} className="card p-5">
              <p className="text-sm font-bold text-text-primary">{layer}</p>
              <p className="mt-2 text-xs leading-6 text-text-secondary">Layerごとの観測状態</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-8 text-text-secondary">
          あるLayerのSTATEが別のLayerを自動的に上書きする、という説明はTUTTOの原則ではありません。Layer = Ownership / Responsibility の関係を維持します。
        </p>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Display Change / STATE Change"
          title="表示変更とSTATE変化を同一視しない"
          description="表示時間足の変更、画面の再描画、ページの再読み込みなどは、それ自体では市場イベントではありません。Market LayerとStructure Theoryの境界に合わせて扱います。"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Display Change</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">画面、view、表示解像度の変化。これだけではSTATE changeではありません。</p>
          </div>
          <RefreshCw className="mx-auto text-primary" size={22} strokeWidth={1.8} aria-hidden="true" />
          <div className="card border-primary p-6">
            <p className="text-sm font-bold text-text-primary">STATE Change</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">市場側の観測変化によって、Structureの現在状態として整理される変化。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="STATE Before Decision"
          title="STATEはDecisionの前にあるObservation Context"
          description="STATEはDecisionそのものではありません。市場の現在状態を整理し、人間が次の判断へ進むための文脈を整えます。"
        />
        <div className="card p-6 sm:p-8">
          <FlowChart
            steps={[
              { label: "Market" },
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
          eyebrow="Trade Plan Boundary"
          title="Trade Planの詳細は次のDocumentationへ委ねる"
          description="このページでは、実行計画、数量、注文、利確、損切りなどは扱いません。STATEからTrade Planを直接生成する説明も行いません。"
        />
        <div className="card border-primary p-6">
          <p className="text-sm font-bold text-text-primary">Coming next: Trade Plan</p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">まだ公開routeを作らないため、ここではリンクではなくComing nextとして案内します。</p>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Theory Audit"
          title="このページで公開しないもの"
          description="STATEをSignalや内部仕様として誤解させないため、今回の公開レベルでは以下を掲載しません。"
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {BOUNDARIES.map((item) => (
            <div key={item} className="card flex items-start gap-3 px-5 py-4 text-sm font-semibold text-text-primary">
              <AlertTriangle className="mt-px shrink-0 text-warning" size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
