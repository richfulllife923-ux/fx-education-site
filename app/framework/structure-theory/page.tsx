import { ArrowDown, Boxes, CircleDot, Eye, GitBranch, Layers3, LocateFixed, Route, ScanLine, Split, Workflow } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { Callout, FlowChart } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Structure Theory | TUTTO Framework",
  description: "TUTTOが市場構造をどのように観測し、Structural Movement、Parent Structure、Acceptance / Rejectionを整理するかを説明する公式Documentation。",
  path: "/framework/structure-theory",
});

const MOVEMENTS = ["HH", "HL", "LL", "LH"];

const THEORY_POINTS = [
  {
    icon: Boxes,
    title: "Market Structure",
    description: "TUTTOは価格の上下を孤立した売買Signalとして扱うのではなく、後続のObservationを行うための市場文脈としてStructureを扱います。",
  },
  {
    icon: GitBranch,
    title: "Structural Movement",
    description: "HH、HL、LL、LHはStructureを読むための観測語です。自動的なEntry Ruleではありません。",
  },
  {
    icon: Layers3,
    title: "Parent Structure",
    description: "大きなStructural Movementの中に小さなMovementが存在することがあります。ただし時間足そのものに絶対的な優劣を与えません。",
  },
  {
    icon: Split,
    title: "Layer Ownership",
    description: "Execution、Swing、Structure、Macroは優劣ではなく、Observationの所有範囲を整理するための入口です。詳細はMarket Layerで扱います。",
  },
  {
    icon: LocateFixed,
    title: "Structure Identity",
    description: "表示時間足の変更は、それだけで市場構造の変化ではありません。表示の変化と市場の変化を分けて扱います。",
  },
  {
    icon: CircleDot,
    title: "Acceptance / Rejection",
    description: "Candidate Structureに対する市場の反応を観測し、そのStructureがどのように扱われているかを整理します。",
  },
];

const NOT_SIGNAL_RULES = [
  "HH = BUY",
  "HL = BUY",
  "LL = SELL",
  "LH = SELL",
];

export default function StructureTheoryPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Structure Theory", path: "/framework/structure-theory" }]} />

      <section className="container-page pt-6">
        <div className="max-w-4xl">
          <p className="eyebrow"><ScanLine size={14} strokeWidth={1.8} /> Structure Theory</p>
          <h1 className="font-display text-4xl font-black leading-tight text-text-primary sm:text-5xl">市場構造をどう観測するか。</h1>
          <p className="mt-6 text-[15px] leading-8 text-text-secondary sm:text-base">
            TUTTOは、価格の上下を単純な売買Signalとして見るのではありません。市場が形成したStructureと、そのStructureに対する実際の反応を観測します。
          </p>
        </div>
      </section>

      <section className="container-page mt-12">
        <Callout title="PhilosophyからStructure Theoryへ">
          Philosophyは市場を見る原則を整理します。Structure Theoryは、その原則を受けて、市場構造をどのように観測するかを説明するDocumentationです。
        </Callout>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Market Structure" title="Structureは市場文脈である" description="TUTTOにおけるStructureは、単なる上昇・下降の名前ではありません。どこから動き、どのようなStructureを形成し、市場がそれをどう扱っているかを整理するための文脈です。" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {THEORY_POINTS.map((point) => (
            <article key={point.title} className="card flex h-full flex-col gap-4 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-button border border-primary bg-[rgba(59,130,246,0.10)] text-primary">
                <point.icon size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-text-primary">{point.title}</h2>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{point.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Structural Movement" title="HH / HL / LL / LHは観測語である" description="Structural Movementは、Structureを読むための材料です。単独で売買判断へ変換するためのRuleではありません。" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Observation Terms</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {MOVEMENTS.map((movement) => (
                <div key={movement} className="rounded-card border border-border bg-background px-4 py-5 text-center font-display text-2xl font-black text-text-primary">
                  {movement}
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Not automatic signals</p>
            <div className="mt-4 space-y-2">
              {NOT_SIGNAL_RULES.map((rule) => (
                <p key={rule} className="rounded-button border border-border bg-background px-4 py-3 text-sm text-text-secondary">{rule}</p>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-text-secondary">これらは避けるべき単純化です。TUTTOはMovementをStructureの観測材料として扱います。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Parent Structure" title="大きなStructureと小さなMovement" description="より大きなStructural Movementの内側に、より小さなMovementが存在することがあります。これは時間足の優劣ではなく、Observationの範囲を整理するための考え方です。" />
        <div className="card p-6 sm:p-8">
          <FlowChart
            steps={[
              { label: "Parent Structure", note: "観測範囲" },
              { label: "Movement", note: "内部の動き" },
              { label: "Observation", note: "扱われ方を見る" },
            ]}
          />
          <p className="mt-6 text-sm leading-8 text-text-secondary">上位時間足が常に強い、という扱いはTUTTOの原則ではありません。時間足はStructure / Observation ownershipを整理する補助として扱います。</p>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Layer Ownership" title="時間足ではなく、観測の所有範囲を整理する" description="Execution、Swing、Structure、MacroはMarket Layerへの入口です。このページでは詳細仕様に踏み込まず、Structure Theoryに必要な範囲だけを扱います。" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {['Execution', 'Swing', 'Structure', 'Macro'].map((layer) => (
            <div key={layer} className="card px-4 py-5 text-center text-sm font-bold text-text-primary">{layer}</div>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Structure Identity" title="表示の変化と市場の変化を分ける" description="Structureは、チャートの表示時間足を変更しただけで別のStructureになるものではありません。" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Display / View Change</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">表示時間足の変更、画面の再描画、ページの再読み込みなどは、それ自体が市場イベントではありません。</p>
          </div>
          <ArrowDown className="mx-auto text-primary lg:-rotate-90" size={22} strokeWidth={1.8} aria-hidden="true" />
          <div className="card border-primary p-6">
            <p className="text-sm font-bold text-text-primary">Market Change</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">市場が形成したStructureと、そのStructureに対する反応を観測対象として扱います。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Structural Origin / Pullback" title="OriginとPullbackを固定比率で定義しない" description="Structureには、その動きを追跡するためのobservable origin / referenceがあります。ただしOriginやPullbackを固定された数値比率で決めるものではありません。" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Structural Origin</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">Structureの発展を追うための参照点です。市場がどこから動き、どのようなStructureを形成したのかを観測します。</p>
          </div>
          <div className="card p-6">
            <p className="text-sm font-bold text-text-primary">Pullback</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">Pullbackは固定値ではなく、市場イベントとして認証されるものです。関連する活動量の meaningful increase は認証概念と関係しますが、詳細条件は深いDocumentationで扱います。</p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Acceptance / Rejection" title="Candidate Structureがどう扱われているかを見る" description="市場の反応は、Candidate Structureが現在どのように扱われているかを観測する材料になります。ただし、未来を保証するものではありません。" />
        <FlowChart
          steps={[
            { label: "Candidate Structure" },
            { label: "Observation" },
            { label: "Acceptance / Rejection" },
            { label: "Decision" },
          ]}
        />
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Structure Before Trade Plan" title="Trade PlanはStructureの後に整理される" description="Trade PlanがStructureを後付けで作るのではありません。Structureが先にあり、その観測結果をもとに後から計画が整理されます。" />
        <div className="card p-6 sm:p-8">
          <FlowChart
            steps={[
              { label: "Market" },
              { label: "Structure" },
              { label: "Observation" },
              { label: "Acceptance / Rejection" },
              { label: "Decision" },
              { label: "Trade Plan" },
            ]}
          />
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Next Documentation" title="次に読むページ" description="Market Layerは次のDocumentationとして準備します。まだ公開routeは作成しないため、ここでは非リンクの案内に留めます。" />
        <div className="card border-primary p-6">
          <p className="text-sm font-bold text-text-primary">Next: Market Layer</p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">次の段階では、Execution、Swing、Structure、Macroの観測layerをより具体的に整理します。</p>
        </div>
      </section>
    </div>
  );
}
