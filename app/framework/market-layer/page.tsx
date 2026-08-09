import { AlertTriangle, Boxes, Layers3, MonitorCog, MoveHorizontal, Network } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { Callout, FlowChart } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Market Layer | TUTTO Framework",
  description: "TUTTOにおけるMarket Layerを、時間足の優劣ではなくStructure OwnershipとObservation Responsibilityとして整理する公式Documentation。",
  path: "/framework/market-layer",
});

const LAYERS = [
  {
    icon: MonitorCog,
    name: "Execution",
    timeframes: "M1 / M5 / M15",
    responsibility: "細かい市場反応や実行に近い構造を観測するLayer。短い表示時間足で見えるから上位・下位が決まるわけではありません。",
  },
  {
    icon: MoveHorizontal,
    name: "Swing",
    timeframes: "M30 / H1",
    responsibility: "中間的なStructural Movementを整理するLayer。Executionとは異なる観測責任を持ちます。",
  },
  {
    icon: Boxes,
    name: "Structure",
    timeframes: "H4 / D1",
    responsibility: "主要な市場構造と文脈を観測するLayer。より大きく見えることは、自動的な権威を意味しません。",
  },
  {
    icon: Network,
    name: "Macro",
    timeframes: "W1 / MN",
    responsibility: "大域的な市場文脈を観測するLayer。Macroは常に最強、という扱いはTUTTOの原則ではありません。",
  },
];

const BOUNDARIES = [
  "上位の表示時間足が必ず優先されるという扱い",
  "Macroを常に最優先の判断根拠にする扱い",
  "短い表示時間足を単純に弱いものとして扱うこと",
  "移動平均によってLayerの方向や権威を決めること",
  "自動的な売買シグナル化",
  "固定比率によってPullbackを定義すること",
  "表示変更と市場変化を同一視すること",
];

export default function MarketLayerPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Framework", path: "/framework" }, { name: "Market Layer", path: "/framework/market-layer" }]} />

      <section className="container-page pt-6">
        <div className="max-w-4xl">
          <p className="eyebrow"><Layers3 size={14} strokeWidth={1.8} /> Market Layer</p>
          <h1 className="font-display text-4xl font-black leading-tight text-text-primary sm:text-5xl">
            時間足の優劣ではなく、Structureの役割を分ける。
          </h1>
          <p className="mt-6 text-[15px] leading-8 text-text-secondary sm:text-base">
            TUTTOのMarket Layerは、どの時間足が強いかを決めるための階層ではありません。Execution、Swing、Structure、Macroが、それぞれ異なるStructureとObservation Responsibilityを持つことを整理するためのDocumentationです。
          </p>
        </div>
      </section>

      <section className="container-page mt-12">
        <Callout title="TIMEFRAME ≠ AUTHORITY">
          Timeframeは市場を見るためのview / resolutionです。LayerはStructureのObservation ResponsibilityとOwnershipを整理するための概念です。TUTTOでは、この2つを同一視しません。
        </Callout>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Why Layers Exist"
          title="Layerは、観測責任の混線を減らすためにある"
          description="単一の表示時間足だけで市場を説明しようとすると、Structure、Observation、Decisionが混ざります。Market Layerは、どのLayerがどのStructureを観測しているのかを分けるための整理です。"
        />
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
        <SectionHeading
          eyebrow="Four Market Layers"
          title="4つのObservation Responsibility"
          description="以下のtimeframe mappingは観測assignmentです。優劣ランキングではなく、それぞれのLayerが担うStructureの範囲を整理するために使います。"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            return (
              <article key={layer.name} className="card flex h-full flex-col gap-4 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-button border border-primary bg-[rgba(59,130,246,0.10)] text-primary">
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-text-primary">{layer.name}</h2>
                  <p className="mt-2 text-sm font-semibold text-primary">{layer.timeframes}</p>
                  <p className="mt-4 text-sm leading-7 text-text-secondary">{layer.responsibility}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Structure Ownership"
          title="LAYER = RESPONSIBILITY / OWNERSHIP"
          description="Layer Ownershipとは、どのObservation LayerがそのStructureを担当しているかを整理する概念です。Layerは優劣ではなく、責任範囲を示します。"
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="card border-primary p-6">
            <p className="text-sm font-bold text-text-primary">Structure Before Timeframe</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              TimeframeがStructureを作るのではありません。市場がStructureを形成し、LayerがそのStructureの観測責任を持ち、Timeframeはそれを見るための表示です。
            </p>
          </div>
          <div className="card p-6">
            <FlowChart
              steps={[
                { label: "Market" },
                { label: "Structure" },
                { label: "Layer Ownership" },
                { label: "Timeframe View" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Same-Layer Consistency"
          title="同一Layer内の表示変更は、Structure Identityを再定義しない"
          description="Execution内でM1 / M5 / M15を切り替える、Swing内でM30 / H1を切り替える、といったview changeだけでStructure IdentityやOwnershipが別物になるわけではありません。"
        />
        <Callout title="Chart Timeframe Change is not Market Event">
          表示時間足の変更、page reload、redraw、indicator reattach、terminal restartは、それ自体では市場構造の変化ではありません。TUTTOでは表示の変化と市場の変化を分けます。
        </Callout>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Multi-Layer Coexistence"
          title="複数LayerのStructureは同時に存在できる"
          description="Macro、Structure、Swing、Executionは互いを自動的に消し合うものではありません。異なるLayerが異なる状態を示すことは、ただちに矛盾ではありません。"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {LAYERS.map((layer) => (
            <div key={layer.name} className="card p-5">
              <p className="text-sm font-bold text-text-primary">{layer.name} Structure</p>
              <p className="mt-2 text-xs leading-6 text-text-secondary">異なる観測責任を持つStructure context</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Layer Conflict"
          title="ConflictはErrorではなく、Observation Contextである"
          description="Layer同士が異なる方向や状態を示していても、自動的にどちらかが正しいとは扱いません。Conflictそのものを市場状態を理解するための情報として観測します。"
        />
        <div className="card p-6 sm:p-8">
          <FlowChart
            steps={[
              { label: "Layer A" },
              { label: "Layer Conflict" },
              { label: "Observation Context" },
            ]}
          />
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Display Change / Market Change"
          title="表示の変化と市場の変化を分ける"
          description="表示時間足の変更や画面の再描画は、市場イベントではありません。市場がStructureに対して新しい反応を示したとき、Observationの対象になります。"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Display Change</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">UI、view、表示解像度の変更。これだけではStructure Changeではありません。</p>
          </div>
          <div className="card border-primary p-6">
            <p className="text-sm font-bold text-text-primary">Market Change</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">市場がStructureに対して受容、拒否、保留、遷移などの反応を示すこと。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="STATE Boundary"
          title="STATEの詳細は、次のDocumentationで扱う"
          description="Market Layerでは、Layerごとに異なるStructure Stateを観測できるという入口までに留めます。STATE遷移、Pending、Invalidation、Acceptance lifecycleの詳細は先取りしません。"
        />
        <div className="card border-primary p-6">
          <p className="text-sm font-bold text-text-primary">Coming next: STATE</p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">まだ公開routeを作らないため、ここではリンクではなくComing nextとして案内します。</p>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Trade Plan Boundary"
          title="Market LayerはTrade Planを直接作らない"
          description="Market Layerは売買や実行の指示を直接生成するものではありません。Observationの責任範囲を整理し、その後のDecisionやTrade Planへつなぐための前段階です。"
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
          eyebrow="Theory Audit"
          title="このページで導入しないもの"
          description="Market Layerを一般的な時間足階層や売買Signalへ戻さないため、以下の考え方は採用しません。"
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
