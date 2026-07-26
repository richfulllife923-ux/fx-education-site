import { buildMetadata, faqJsonLd } from "@/lib/seo";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { ComparisonTable } from "@/components/Diagram";

export const metadata = buildMetadata({
  title: "FX基礎知識｜初心者が最初に覚えるべき9つの用語",
  description:
    "レバレッジ、ロット、スプレッド、損切り、リスクリワード、ゼロカット、追証、国内FXと海外FXの違いなど、FX初心者が最初に理解すべき基礎用語をやさしく解説します。",
  path: "/fx-basics",
});

const TERMS = [
  {
    term: "レバレッジ",
    desc: "自己資金より大きな金額の取引を可能にする仕組み。利益も損失も拡大するため、初心者ほど低倍率から始めるのが安全です。",
  },
  {
    term: "ロット",
    desc: "取引数量の単位。ロット数が大きいほど、値動き1pipsあたりの損益額も大きくなります。",
  },
  {
    term: "スプレッド",
    desc: "買値と売値の差のことで、実質的な取引コストです。スプレッドが狭いほど、短期売買に有利とされます。",
  },
  {
    term: "損切り（ストップロス）",
    desc: "含み損が一定水準に達した時点で、機械的にポジションを決済すること。資金管理の中核をなす行動です。",
  },
  {
    term: "リスクリワード",
    desc: "1回の取引における「損失想定」と「利益想定」の比率。リスクリワードが良いほど、勝率が低くても収支を維持しやすくなります。",
  },
  {
    term: "ゼロカット",
    desc: "急激な相場変動で口座残高がマイナスになった場合、そのマイナス分を業者が補填し、残高をゼロに戻す仕組みです。",
  },
  {
    term: "追証（追加証拠金）",
    desc: "証拠金が不足した際に、不足分の入金を求められる制度。ゼロカット対応の海外FXでは基本的に発生しません。",
  },
  {
    term: "国内FX",
    desc: "日本の金融庁の規制下にあるFX業者。レバレッジは最大25倍に制限され、追証が発生する仕組みが一般的です。",
  },
  {
    term: "海外FX",
    desc: "海外の金融ライセンスで運営されるFX業者。高いレバレッジやゼロカットが特徴ですが、規制環境は業者ごとに異なります。",
  },
];

export default function FxBasicsPage() {
  const faq = faqJsonLd(
    TERMS.map((t) => ({ question: `${t.term}とは何ですか？`, answer: t.desc }))
  );

  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "FX基礎知識", path: "/fx-basics" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Glossary"
          title="FX基礎知識｜まずはこの9つの言葉から"
          description="専門用語につまずいて挫折しないよう、初心者が最初に理解しておきたい基礎用語を一つずつ解説します。"
        />
      </section>

      <section className="container-page mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {TERMS.map((t) => (
          <div key={t.term} id={t.term} className="card p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">{t.term}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.desc}</p>
          </div>
        ))}
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Compare" title="国内FXと海外FXの違い（概要）" />
        <ComparisonTable
          headers={["項目", "国内FX", "海外FX"]}
          rows={[
            ["最大レバレッジ", "25倍", "業者により数百倍〜（変動あり）"],
            ["追証", "発生しうる", "ゼロカット採用が一般的"],
            ["規制", "金融庁登録", "海外ライセンス（業者ごとに異なる）"],
            ["向いている人", "国内規制を重視する人", "少額資金で始めたい人"],
          ]}
        />
        <p className="mt-4 text-xs text-muted">
          ※ 制度・規制は業者や時期によって変更される場合があります。最新情報は各業者の公式情報をご確認ください。
        </p>
      </section>
    </div>
  );
}
