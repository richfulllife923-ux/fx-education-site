import { ArrowDown, Boxes, Eye, GitBranch, Layers3, MonitorCog, MoveHorizontal, Network, Rows3, Split, Workflow } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { Callout, FlowChart } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Market Layer | TUTTO Framework",
  description: "TUTTOが時間足の優劣ではなく、Layer OwnershipとObservation Responsibilityによって市場構造を整理する公式Documentation。",
  path: "/framework/market-layer",
});

const LAYERS = [
  {
    icon: MonitorCog,
    name: "Execution",
    timeframes: "M1 / M5 / M15",
    role: "execution-level structural movementを観測するLayerです。短い表示単位そのものが権威になるわけではありません。",
  },
  {
    icon: MoveHorizontal,
    name: "Swing",
    timeframes: "M30 / H1",
    role: "swing-level structural movementを観測するLayerです。Executionとは異なる観測責任を持ちます。",
  },
  {
    icon: Boxes,
    name: "Structure",
    timeframes: "H4 / D1",
    role: "broader structural movementを観測するLayerです。観測範囲を整理するための役割を持ちます。",
  },
  {
    icon: Network,
    name: "Macro",
    timeframes: "W1 / MN",
    role: "macro structural contextを観測するLayerです。全てを支配する答えではなく、macro contextを担当します。",
  },
];

const COEXISTING = [
  { label: "Macro Structure", note: "macro context" },
  { label: "Structure Structure", note: "broader condition" },
  { label: "Swing Structure", note: "swing condition" },
  { label: "Execution Structure", note: "execution condition" },
];

const AUDIT_POINTS = [
  "Timeframe does not determine superiority.",
  "Layer determines responsibility and ownership.",
  "Display Change is not Market Change.",
  "Timeframe Change is not Structure Change.",
];

export default function MarketLayerPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Framework", path: "/framework" }, { name: "Market Layer", path: "/framework/market-layer" }]} />

      <section className="container-page pt-6">
        <div className="max-w-4xl">
          <p className="eyebrow"><Layers3 size={14} strokeWidth={1.8} /> Market Layer</p>
          <h1 className="font-display text-4xl font-black leading-tight text-text-primary sm:text-5xl">時間足の優劣ではなく、構造の役割と所有範囲を分ける。</h1>
          <p className="mt-6 text-[15px] leading-8 text-text-secondary sm:text-base">
            TUTTOのMarket Layerは、どの時間足が強いかを決めるためのものではありません。Execution、Swing、Structure、Macroが、それぞれ異なるObservation Responsibilityを持つことを整理するためのDocumentationです。
          </p>
        </div>
      </section>

      <section className="container-page mt-12">
        <Callout title="TIMEFRAME は AUTHORITY ではない">
          TUTTOでは、時間足が大きいという理由だけで、そのObservationを上位の判断として扱いません。Layer Ownershipが示すのは、どのObservation ResponsibilityがそのStructureを担当するかです。
        </Callout>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Why Layers Exist" title="Layerは構造の混線を減らすためにある" description="異なる観測責任を持つMovementを1つのSignalへ押し込むと、Structure、Observation、Decisionが混ざります。Market Layerはその混線を避けるための整理です。" />
        <div className="card p-6 sm:p-8">
          <FlowChart
            steps={[
              { label: "Market" },
              { label: "Structure" },
              { label: "Layer Ownership" },
              { label: "Observation" },
            ]}
          />
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Four Market Layers" title="4つのObservation Responsibility" description="以下の時間足グループは観測割り当てです。力の順位ではありません。" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {LAYERS.map((layer) => (
            <article key={layer.name} className="card flex h-full flex-col gap-4 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-button border border-primary bg-[rgba(59,130,246,0.10)] text-primary">
                <layer.icon size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-text-primary">{layer.name}</h2>
                <p className="mt-2 text-sm font-semibold text-primary">{layer.timeframes}</p>
                <p className="mt-4 text-sm leading-7 text-text-secondary">{layer.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Layer Ownership" title="StructureはObservation Layerに属する" description="Market Layerの中心はOwnershipです。Layerは優劣ではなく、Structureの観測責任と所有範囲を分けます。" />
        <div className="card p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="rounded-card border border-primary bg-[rgba(59,130,246,0.10)] p-5">
              <p className="text-sm font-bold text-text-primary">Market Structure</p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">観測対象となるStructureは、役割に応じてLayer Ownershipを持ちます。</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {LAYERS.map((layer) => (
                <div key={layer.name} className="rounded-card border border-border bg-surface px-4 py-5 text-center text-sm font-bold text-text-primary">
                  {layer.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Coexisting Structures" title="複数LayerのStructureは同時に存在できる" description="異なるLayerが異なるStructural conditionを観測していても、それは自動的な矛盾ではありません。Observation Responsibilityが違うためです。" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {COEXISTING.map((item) => (
            <div key={item.label} className="card p-5">
              <p className="text-sm font-bold text-text-primary">{item.label}</p>
              <p className="mt-2 text-xs leading-6 text-text-secondary">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Timeframe Authority" title="時間足はAuthorityではない" description="時間足は観測解像度を整理します。Layerは構造の責任範囲を定義します。この2つを混同しないことが重要です。" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Timeframe</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">表示や観測解像度を整理する補助です。</p>
          </div>
          <ArrowDown className="mx-auto text-primary lg:-rotate-90" size={22} strokeWidth={1.8} aria-hidden="true" />
          <div className="card border-primary p-6">
            <p className="text-sm font-bold text-text-primary">Layer Ownership</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">StructureのObservation Responsibilityと所有範囲を整理します。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Display Change / Market Change" title="表示の変化と市場の変化を分ける" description="表示時間足の変更、画面の再描画、viewの再表示は、それ自体では市場構造の変化ではありません。" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Display Change</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">表示・UI・viewの変化です。市場イベントそのものではありません。</p>
          </div>
          <div className="card border-primary p-6">
            <p className="text-sm font-bold text-text-primary">Market Change</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">市場がStructureに対して新しい反応を示したとき、Observationの対象になります。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Parent Structure" title="Parent Structureは時間足階層そのものではない" description="小さなStructural Movementが広いStructural contextの内側に存在することはあります。ただしParent Structureは単純に大きい時間足を意味するものではありません。" />
        <Callout title="Structural relationship">
          Parent Structureは構造関係です。時間足の大きさをそのまま優先順位へ変換しないことが、Market Layerの重要な境界です。
        </Callout>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Layer Before Decision" title="Market LayerはDecisionの前にある" description="Market LayerはBUY / SELL / ENTRY / EXITを直接作るものではありません。Observationの責任範囲を整理し、その後のDecisionとTrade Planへつなぐための前段です。" />
        <div className="card p-6 sm:p-8">
          <FlowChart
            steps={[
              { label: "Market" },
              { label: "Structure" },
              { label: "Layer Ownership" },
              { label: "Observation" },
              { label: "Acceptance / Rejection" },
              { label: "Decision" },
              { label: "Trade Plan" },
            ]}
          />
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Theory Audit" title="このページで守る境界" description="Market Layerを一般的な時間足順位論へ戻さないための確認です。" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {AUDIT_POINTS.map((point) => (
            <div key={point} className="card px-5 py-4 text-sm font-semibold text-text-primary">{point}</div>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Next Documentation" title="次に読むページ" description="STATEは次のDocumentationとして準備します。まだ公開routeは作成しないため、ここでは非リンクの案内に留めます。" />
        <div className="card border-primary p-6">
          <p className="text-sm font-bold text-text-primary">Next: STATE</p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">次の段階では、Structureがどのような状態として整理されるかを扱います。</p>
        </div>
      </section>
    </div>
  );
}