import { Suspense } from "react";
import EmergingClient from "@/components/stock-analysis/EmergingClient";
import { buildMetadata } from "@/lib/seo";
import { StockHero, StockLink } from "@/components/stock-analysis/StockUI";
export const metadata = buildMetadata({ title: "成長企業発掘", description: "広く認知されていない企業の事業・成長・Cash Flowの構造変化を研究します。", path: "/stock-analysis/emerging-growth/" });
export default function EmergingGrowthPage() {
  return <><StockHero title="成長企業発掘" english="Emerging Growth" description="まだ広く認知されていない成長企業を探す。売上、利益、Cash Flow、市場シェア、顧客、製品、産業構造などに変化が始まっている企業を、Evidenceから研究します。" />
    <div className="grid gap-5 md:grid-cols-3">{[
      ["Established Quality", "すでに市場で認知されている大型優良企業を、別枠で観察します。"],
      ["Emerging Growth", "成長が数字として現れ始めている中小型〜中大型企業を重点的に研究します。"],
      ["Early Inflection", "需要、受注、利益率、顧客、Cash Flowに変化が始まっている企業を重点的に研究します。"],
    ].map(([title, text]) => <section key={title} className="card p-5 sm:p-6"><h2 className="text-lg font-bold">{title}</h2><p className="mt-3 text-sm leading-7 text-text-secondary">{text}</p></section>)}</div>
    <section className="card mt-6 p-5 sm:p-8"><h2 className="text-2xl font-bold">変化を調べる観点</h2>
      <ul className="mt-5 grid gap-4 text-sm leading-7 text-text-secondary sm:grid-cols-2">{[
        "売上・利益成長の加速と持続性", "需要 → 売上 → 利益率 → 営業CF → FCF",
        "競争優位・市場シェア・顧客基盤の変化", "市場規模と実際の浸透率",
        "周辺企業・二次恩恵・三次恩恵の確認", "設備投資・運転資本・資本効率",
        "希薄化と1株当たりの成長", "財務・資金調達・流動性リスク",
        "売掛金・在庫・顧客集中などのRed Flags", "Valuationと市場期待の差",
      ].map(item => <li key={item} className="border-l-2 border-emerald-600 pl-3">{item}</li>)}</ul>
    </section>
    <section className="card mt-6 p-5 sm:p-8"><h2 className="text-xl font-bold">研究候補から個別精査へ</h2>
      <p className="mt-3 text-sm leading-8 text-text-secondary">Why now / What is changing / Evidence / Counter-thesis / Next confirmationを整理し、企業ごとの完全分析へ進みます。知名度や小型株であることを、機会の証拠にはしません。</p>
      <p className="mt-3 text-sm leading-8 text-text-secondary">企業候補の自動探索は準備中です。現時点では、確認済みの探索結果はありません。</p>
      <div className="mt-5"><StockLink href="/stock-analysis/#stock-input">銘柄を入力して分析</StockLink></div>
    </section>
    <Suspense fallback={<p role="status">読み込み中…</p>}><EmergingClient /></Suspense>
  </>;
}
