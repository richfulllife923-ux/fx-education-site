import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { Callout } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Indicator",
  description: "TUTTO Indicatorの公開準備ページです。",
  path: "/indicator",
});

const PARAMETERS = [
  {
    title: "ENTRY",
    panelTitle: "ENTRY",
    scale: ["100", "80", "60", "40", "20", "0"],
    value: null,
    state: "EARLY",
    tone: "entry",
    activeSegments: 0,
    subtitle: "中長期エントリーの発生確率",
    description: "TUTTOが中長期の市場構造をもとに、エントリー条件が整う可能性を表示します。",
    note: "表示される確率は、現在の市場状態に対するTUTTO内部評価の目安です。",
  },
  {
    title: "MICRO",
    panelTitle: "MICRO",
    scale: ["100", "80", "60", "40", "20", "0"],
    value: "65",
    state: "CONFIRMING",
    tone: "micro",
    activeSegments: 4,
    subtitle: "短期エントリーの発生確率",
    description: "短期の市場構造を観測し、短期エントリー条件が整う可能性を表示します。",
    note: "ENTRYよりも短い時間軸の変化を確認するための表示です。",
  },
  {
    title: "CNN",
    panelTitle: "CNN F&G",
    scale: ["100", "75", "50", "25", "0"],
    value: "47",
    state: "NEUTRAL",
    tone: "fear",
    activeSegments: 3,
    subtitle: "恐怖指数",
    description: "市場全体のFear / Greed環境を確認するための指標です。",
    note: "現在の市場心理が、恐怖側にあるのか、強気側にあるのかを補助的に確認できます。",
  },
];

const ENTRY_COLORS = [
  {
    color: "DeepSkyBlue",
    title: "Short-Term / MICRO Entry",
    layer: "L1 — M1 / M5",
    description:
      "M1をCanonical SourceとするL1（M1/M5）の短期Entry候補です。M5で表示している場合でも、Entryの色は表示時間足ではなく、元となるLayerに基づいて決まります。",
    swatch: "bg-sky-400",
  },
  {
    color: "Orange",
    title: "Mid-Term Entry",
    layer: "L2 — M15 / M30",
    description:
      "L2（M15/M30）の中期Entryに使用する設計の色です。現在のIndicatorではL2 Mid-Term Entry表示は開発中のため、実装後に同じ考え方で区別されます。",
    swatch: "bg-orange-400",
  },
];

function Mt5IndicatorPanel({ parameter }: { parameter: (typeof PARAMETERS)[number] }) {
  const isFearGreed = parameter.tone === "fear";
  const statusClass = parameter.state === "CONFIRMING" || parameter.state === "NEUTRAL" ? "text-yellow-300" : parameter.state === "EARLY" ? "text-red-300" : "text-slate-200";
  const segmentColors = ["bg-red-700/85", "bg-red-500/80", "bg-orange-400/85", "bg-yellow-300/90", "bg-slate-500/45", "bg-slate-500/35"];
  const segments = Array.from({ length: parameter.scale.length }, (_, segmentIndex) => segmentIndex);

  return (
    <div className="flex justify-center md:justify-start">
      <div className="relative h-[178px] w-[96px] border border-slate-200/80 bg-[#05070b] p-[5px] font-mono text-[10px] leading-none text-slate-100">
        <p className="absolute left-[5px] top-[5px] text-[10px] uppercase tracking-normal text-slate-100">{parameter.panelTitle}</p>
        <div className="absolute left-[6px] top-[26px] flex h-[104px] flex-col justify-between text-[9px] text-slate-100">
          {parameter.scale.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="absolute left-[34px] top-[24px] flex h-[108px] w-[16px] flex-col-reverse gap-[3px]">
          {segments.map((segmentIndex) => {
            const active = segmentIndex < parameter.activeSegments;
            return (
              <span
                key={segmentIndex}
                className={`block h-[15px] border border-slate-300/80 ${active ? segmentColors[segmentIndex] : "bg-[#20252b]"}`}
              />
            );
          })}
        </div>
        {parameter.value ? (
          <span className="absolute left-[55px] top-[83px] text-[10px] text-yellow-300">{parameter.value}</span>
        ) : (
          <span className="absolute left-[54px] top-[123px] h-px w-[18px] bg-slate-300/80" />
        )}
        {parameter.tone === "entry" ? (
          <span className="absolute left-[56px] top-[117px] flex items-center gap-[2px] text-[10px] text-red-400">
            <span className="h-[5px] w-[5px] rounded-full border border-red-400" />
            <span className="h-px w-[8px] bg-red-400" />
          </span>
        ) : null}
        {isFearGreed ? (
          <div className="absolute bottom-[24px] left-[6px] grid w-[60px] grid-cols-3 overflow-hidden border border-slate-600/70">
            <span className="h-[5px] bg-red-600/80" />
            <span className="h-[5px] bg-yellow-300/80" />
            <span className="h-[5px] bg-slate-500/45" />
          </div>
        ) : null}
        <p className={`absolute bottom-[7px] left-[5px] text-[10px] uppercase ${statusClass}`}>{parameter.state}</p>
      </div>
    </div>
  );
}

export default function IndicatorPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Indicator", path: "/indicator" }]} />
      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Coming Soon"
          title="TUTTO Indicator"
          description="TUTTO Indicatorは、TUTTO FrameworkをMT5上で可視化するために開発中です。"
        />
        <Callout tone="primary" title="公開準備中">
          まだ購入ボタンや配布導線は追加しません。検証、ドキュメント、公開準備が整った段階で案内します。
        </Callout>
        <div className="mt-6">
          <Link href="/indicator/install" className="btn-ghost">
            MT5へのインストール方法
          </Link>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Parameters"
          title="使い方 / Parameters"
          description="TUTTO Indicatorで表示される主要な確認項目を、公開可能な範囲で整理します。"
        />
        <p className="mt-2 text-sm leading-7 text-text-secondary">以下はMT5上での表示例です。</p>
        <div className="mt-6 grid grid-cols-1 gap-5">
          {PARAMETERS.map((parameter) => (
            <div key={parameter.title} className="card grid gap-6 p-6 md:grid-cols-[120px_1fr] md:items-start">
              <Mt5IndicatorPanel parameter={parameter} />
              <div>
                <p className="font-display text-xs font-black uppercase tracking-[0.16em] text-primary">{parameter.title}</p>
                <h3 className="mt-3 text-lg font-bold text-text-primary">{parameter.subtitle}</h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{parameter.description}</p>
                <p className="mt-4 border-t border-border pt-4 text-sm leading-7 text-text-secondary">{parameter.note}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-7 text-text-secondary">
          ENTRY / MICROの確率表示は、将来の値動きや利益を保証するものではありません。TUTTO Indicatorによる市場構造の観測結果を確認するための補助表示です。
        </p>
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          eyebrow="Usage"
          title="Entryラインの色について"
          description="TUTTOでは、EntryがどのMarket Layerから生まれたかを色で区別します。Entryは売買指示ではなく、市場構造の観測とEntry候補の可視化を補助する表示です。"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {ENTRY_COLORS.map((entryColor) => (
            <div key={entryColor.color} className="card p-6">
              <div className="flex items-start gap-4">
                <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border border-white/40 ${entryColor.swatch}`} aria-hidden="true" />
                <div>
                  <p className="font-display text-xs font-black uppercase tracking-[0.16em] text-primary">{entryColor.color}</p>
                  <h3 className="mt-3 text-lg font-bold text-text-primary">{entryColor.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-text-primary">{entryColor.layer}</p>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">{entryColor.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
