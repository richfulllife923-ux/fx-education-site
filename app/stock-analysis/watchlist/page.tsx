import { buildMetadata } from "@/lib/seo";
import { stockAnalysisAdapter, watchlistCategories } from "@/lib/stock-analysis";
import { StockHero, StockLink } from "@/components/stock-analysis/StockUI";
export const metadata = buildMetadata({ title: "TUTTO 注目銘柄", description: "TUTTOが研究対象として注目している企業を整理するWatchlist。", path: "/stock-analysis/watchlist/" });
export default async function WatchlistPage() {
  const entries = await stockAnalysisAdapter.watchlist();
  return <><StockHero title="TUTTO 注目銘柄" english="TUTTO Watchlist" description="現在TUTTOが研究対象として注目している企業を整理します。研究の理由、一次資料、確認日を添えて企業の変化を観察します。" />
    <ul aria-label="研究対象の分類" className="mb-6 flex flex-wrap gap-2">{watchlistCategories.map(category => <li className="badge" key={category}>{category}</li>)}</ul>
    {entries.length ? <div className="grid gap-5 md:grid-cols-2">{entries.map(entry => <article key={entry.symbol} className="card p-6">
      <h2 className="text-xl font-bold">{entry.companyName}</h2><p className="mt-2 text-sm">{entry.symbol} / {entry.categories.join(" / ")}</p>
      <p className="my-4 text-sm leading-7 text-text-secondary">{entry.researchReason}</p>
      <p className="mb-4 text-xs text-text-secondary">確認日：{entry.asOf}</p>
      {/^https?:\/\//.test(entry.sourceUrl) && <a className="stock-nav mb-4" href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">一次資料を見る →</a>}
      <StockLink href={"/stock-analysis/analyze/?"+new URLSearchParams({symbol: entry.symbol})}>個別分析を見る</StockLink>
    </article>)}</div> : <section className="card p-6 sm:p-8"><h2 className="text-xl font-bold">公開できる研究対象を準備中です</h2><p className="mt-3 text-sm leading-7 text-text-secondary">確認済みの企業情報・研究資料はまだ登録されていません。架空の銘柄リストは表示しません。</p><div className="mt-5"><StockLink href="/stock-analysis/#stock-input">銘柄を入力して分析</StockLink></div></section>}
  </>;
}
