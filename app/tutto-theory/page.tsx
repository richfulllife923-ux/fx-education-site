import { buildMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { Callout } from "@/components/Diagram";
import { CheckCircle2 } from "lucide-react";

export const metadata = buildMetadata({
  title: "TUTTO理論とは｜STATE1〜STATE5で読む市場構造",
  description:
    "当サイト独自の市場構造分析フレームワーク「TUTTO理論」を解説。Market Acceptance、Geometry Score、Fib構造、Structure Breakなどの概念をSTATE1〜STATE5に分けて紹介します。",
  path: "/tutto-theory",
});

const STATES = [
  {
    id: "STATE1",
    title: "Market Acceptance（市場の受容）",
    description:
      "価格がある水準にとどまり、市場参加者に「受け入れられている」かどうかを確認する段階です。値動きの滞留時間や反応の仕方から、その水準の重要度を読み取ります。",
  },
  {
    id: "STATE2",
    title: "Geometry Score（幾何学的評価）",
    description:
      "値幅や角度、波の形状といった幾何学的な特徴をスコア化し、直近の値動きがどの程度「型」に沿っているかを評価する段階です。",
  },
  {
    id: "STATE3",
    title: "Fib構造の確認",
    description:
      "フィボナッチ比率を単独の指標としてではなく、直前のSTATEで確認した市場構造と重ね合わせて検証する段階です。",
  },
  {
    id: "STATE4",
    title: "Transition / Structure Break（構造転換）",
    description:
      "それまでのトレンド構造が転換する兆しを、高値・安値の切り替わり（Structure Break）から確認する段階です。",
  },
  {
    id: "STATE5",
    title: "Pullback Authentication（押し目の認証）",
    description:
      "構造転換後の戻り（プルバック）が、想定した水準で機能するかどうかを確認し、エントリーの根拠を最終的に固める段階です。",
  },
];

const TARGETS = [
  { id: "TP1", label: "第1利益確定目標", note: "直近の値幅を基準とした最初の到達点" },
  { id: "TP2", label: "第2利益確定目標", note: "構造上の次の節目" },
  { id: "TP3", label: "第3利益確定目標", note: "上位足の構造まで含めた最終目標" },
];

export default function TuttoTheoryPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "TUTTO理論", path: "/tutto-theory" }]} />

      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Original Framework"
          title="TUTTO理論とは"
          description="TUTTO理論は、値動きを『受容 → 評価 → 検証 → 転換 → 認証』という5段階（STATE1〜STATE5）で捉え、市場構造とフィボナッチを組み合わせて分析する、当サイト独自のフレームワークです。"
        />
        <Callout tone="sky" title="読み方のポイント">
          各STATEは独立した売買サインではなく、前のSTATEを土台にして次のSTATEを検証する「積み上げ式」の考え方です。
          途中のSTATEが崩れた場合は、そこで分析をやり直します。
        </Callout>
      </section>

      {/* STATEタイムライン */}
      <section className="container-page mt-16">
        <SectionHeading eyebrow="5 States" title="STATE1〜STATE5の全体像" />
        <ol className="relative space-y-6 border-l-2 border-gold-300 pl-8">
          {STATES.map((s) => (
            <li key={s.id} className="relative">
              <span className="absolute -left-[41px] flex h-6 w-6 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-gold-300">
                {s.id.replace("STATE", "")}
              </span>
              <div className="card p-5">
                <p className="eyebrow">{s.id}</p>
                <h3 className="font-display text-lg font-bold text-navy-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* TP1-3 */}
      <section className="bg-surface py-16 mt-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Targets"
            title="利益確定目標（TP1・TP2・TP3）"
            description="Structure BreakとPullback Authenticationを経たあと、複数の目標水準を段階的に設定する考え方です。"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {TARGETS.map((t) => (
              <div key={t.id} className="card flex items-start gap-3 p-5">
                <CheckCircle2 className="mt-0.5 shrink-0 text-gold-600" size={20} />
                <div>
                  <p className="font-display font-bold text-navy-900">{t.id}</p>
                  <p className="text-sm text-navy-700">{t.label}</p>
                  <p className="mt-1 text-xs text-muted">{t.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <Callout tone="danger" title="ご利用にあたって">
          TUTTO理論は市場構造を理解するための分析フレームワークであり、将来の値動きや利益を保証するものではありません。
          実際の取引では、必ず資金管理のルールと合わせてご活用ください。
        </Callout>
      </section>
    </div>
  );
}
