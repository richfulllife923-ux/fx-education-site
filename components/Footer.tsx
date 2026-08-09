import Link from "next/link";
import { Rss } from "lucide-react";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Framework",
    links: [
      { href: "/manifesto", label: "Manifesto" },
      { href: "/framework", label: "Framework" },
      { href: "/research", label: "Research" },
      { href: "/indicator", label: "Indicator" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/roadmap", label: "Roadmap" },
      { href: "/brokers", label: "FX会社を選ぶ" },
      { href: "/fx-basics", label: "基礎知識" },
      { href: "/fund-management", label: "資金管理" },
      { href: "/blog", label: "ブログ" },
    ],
  },
  {
    title: "Site",
    links: [
      { href: "/profile", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/sitemap.xml", label: "Sitemap" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background text-text-secondary">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="inline-flex items-center" aria-label="TUTTO Home">
            <img src="/brand/tutto-logo-dark.svg" alt="TUTTO" className="h-10 w-auto" />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            Market Structure Observation Framework。市場を予測するのではなく、市場が採用した構造を観測するための研究・開発プロジェクトです。
          </p>
          <div className="mt-5 flex gap-3">
            <a href="/rss.xml" aria-label="RSS" className="rounded-button border border-border p-2 hover:border-primary hover:text-text-primary">
              <Rss size={16} strokeWidth={1.8} />
            </a>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-text-primary">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-text-secondary hover:text-text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TUTTO. All rights reserved.</p>
          <p className="max-w-2xl leading-relaxed">
            本サイトは研究・教育目的の情報提供です。将来の価格、利益、取引結果を保証するものではありません。実際の判断はご自身の責任で行ってください。
          </p>
        </div>
      </div>
    </footer>
  );
}
