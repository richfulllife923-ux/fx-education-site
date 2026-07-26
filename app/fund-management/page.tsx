import { ShieldOff, PiggyBank, TrendingDown, Gauge, Brain, Lock, HandCoins } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { PrincipleCard, FlowChart, ComparisonTable, Callout } from "@/components/Diagram";

export const metadata = buildMetadata({
  title: "資金管理の基本｜生存率を上げる7つの原則",
  description:
    "FXで資金を守るための資金管理の考え方を解説。大きく負けない、追加入金しない、利益は出金するなど、生存率を上げる7つの原則を図解付きで紹介します。",
  path: "/fund-management",
});

const PRINCIPLES = [
  { icon: TrendingDown, title: "大きく負けない", description: "連勝より重要なのは、致命的な1回の逆行を避けること。損失の上限をあらかじめ決めておきます。" },
  { icon: ShieldOff, title: "追加入金をしない", description: "含み損を追加入金で埋める行動は、負けを取り返そうとする心理の表れ。ルール化して距離を置きます。" },
  { icon: HandCoins, title: "利益は出金する", description: "口座内の含み益は「利益」ではなく「リスクにさらされた数字」。一定額に達したら出金ルールを実行します。" },
  { icon: Lock, title: "原資を守る", description: "最初に入金した金額（原資）を失わないことを最優先目標に設定し、そこから逆算して取引量を決めます。" },
  { icon: Gauge, title: "ロットを急に上げない", description: "資金が増えても、ロットは段階的に。急なロット増加は、致命的な損失の確率を跳ね上げます。" },
  { icon: Brain, title: "勝った後ほど慎重に", description: "連勝後は「自分は上手い」という錯覚が生まれやすいタイミング。あえてロットを下げて様子を見ます。" },
  { icon: PiggyBank, title: "資金を守ることを最優先", description: "利益を狙う判断より先に、資金を守る判断を置く。これが生存率を上げる最も基本的な考え方です。" },
];

export default function FundManagementPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "資金管理", path: "/fund-management" }]} />

      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Risk Management"
          title="資金管理とは、生存率を上げる技術である"
          description="FXにおける資金管理とは、根性論ではなく「仕組み」です。感情に左右されず、あらかじめ決めたルールに従って資金を守る。ここでは、そのための考え方を整理します。"
        />

        <Callout tone="gold" title="このページの結論">
          勝率を上げることよりも先に、「退場しない仕組み」を作ることが重要です。
          1回の取引で口座資金の大部分を失わないルールさえ守れれば、学習を続ける時間を確保できます。
        </Callout>
      </section>

      {/* 7原則 */}
      <section className="container-page mt-16">
        <SectionHeading eyebrow="7 Principles" title="生存率を上げる7つの原則" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <PrincipleCard key={p.title} {...p} />
          ))}
        </div>
      </section>

      {/* フローチャート: 損失発生時の行動 */}
      <section className="bg-surface py-16 mt-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Flow"
            title="損失が発生したときの行動フロー"
            description="感情的な判断を避けるために、あらかじめ行動の順番を決めておきます。"
          />
          <FlowChart
            steps={[
              { label: "① 損切りルールに到達", note: "エントリー時に決めた水準" },
              { label: "② 機械的に決済する", note: "感情を挟まず実行" },
              { label: "③ チャートを閉じる", note: "取引を一旦離れる" },
              { label: "④ 追加入金をしない", note: "その日は判断を保留" },
              { label: "⑤ 振り返りを記録する", note: "次の学習材料にする" },
            ]}
          />
        </div>
      </section>

      {/* ロット計算表 */}
      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Calculation"
          title="ロットサイズの考え方"
          description="ロットは感覚で決めるものではなく、許容損失とストップ幅から逆算します。"
        />
        <p className="mb-5 rounded-xl bg-navy-50 px-5 py-4 font-mono text-sm text-navy-700">
          ロット数 ＝ 許容損失額 ÷ ストップ幅（pips）÷ 1pipsあたりの価値
        </p>
        <ComparisonTable
          headers={["口座残高", "許容損失（2%想定）", "ストップ幅", "考え方"]}
          rows={[
            ["50,000円", "1,000円", "20pips", "1トレードの損失を残高の一部に固定する"],
            ["100,000円", "2,000円", "20pips", "残高が増えてもリスク率は変えない"],
            ["300,000円", "6,000円", "20pips", "金額が増えても計算の考え方は同じ"],
          ]}
        />
        <p className="mt-4 text-xs text-muted">
          ※ 上記は考え方を示す一例です。許容損失率は個人のリスク許容度によって異なります。
        </p>
      </section>

      <section className="container-page mt-16">
        <Callout tone="danger" title="注意">
          資金管理のルールを守っていても、相場に「絶対」はありません。本ページは一般的な考え方の解説であり、
          特定の投資成果を保証するものではありません。取引の最終判断はご自身の責任で行ってください。
        </Callout>
      </section>
    </div>
  );
}
