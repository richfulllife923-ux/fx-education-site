import Link from "next/link";
export function StockLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="main-cta cta-stock">{children}<span aria-hidden="true">→</span></Link>;
}
export function StockHero({ title, english, description }: { title: string; english: string; description: string }) {
  return <header className="mb-8 max-w-3xl">
    <p className="eyebrow text-emerald-400">{english}</p>
    <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{title}</h1>
    <p className="mt-5 text-[15px] leading-8 text-text-secondary">{description}</p>
  </header>;
}
export function ResearchDisclaimer() {
  return <aside className="mt-12 border-t border-border pt-6 text-xs leading-6 text-text-secondary">
    <p className="mb-2 font-semibold text-text-primary">Research / Education purpose</p>
    <p>TUTTO 株式分析は、企業・市場を研究するための教育・分析情報です。特定銘柄の売買を推奨するものではなく、投資助言、利益保証、将来価格の保証を行うものではありません。最終的な投資判断は利用者自身で行ってください。</p>
  </aside>;
}
