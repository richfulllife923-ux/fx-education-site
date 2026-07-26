import Link from "next/link";
import { Twitter, Youtube, Rss } from "lucide-react";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "学ぶ",
    links: [
      { href: "/fund-management", label: "資金管理" },
      { href: "/tutto-theory", label: "TUTTO理論" },
      { href: "/fx-basics", label: "FX基礎知識" },
      { href: "/fibonacci", label: "フィボナッチ講座" },
    ],
  },
  {
    title: "サイト",
    links: [
      { href: "/overseas-fx", label: "海外FX" },
      { href: "/tools", label: "おすすめツール" },
      { href: "/blog", label: "ブログ一覧" },
      { href: "/profile", label: "運営者プロフィール" },
    ],
  },
  {
    title: "サポート",
    links: [
      { href: "/contact", label: "お問い合わせ" },
      { href: "/sitemap.xml", label: "サイトマップ" },
      { href: "/rss.xml", label: "RSSフィード" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-navy-900 text-navy-100">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <p className="font-display text-lg font-bold text-white">FX生存戦略ラボ</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-navy-300">
            勝率ではなく、生存率を上げる。FX初心者が安心して学べる教育サイトです。
          </p>
          <div className="mt-5 flex gap-3">
            <a href="#" aria-label="X (Twitter)" className="rounded-full border border-navy-500 p-2 hover:border-gold-500 hover:text-gold-500">
              <Twitter size={16} />
            </a>
            <a href="#" aria-label="YouTube" className="rounded-full border border-navy-500 p-2 hover:border-gold-500 hover:text-gold-500">
              <Youtube size={16} />
            </a>
            <a href="/rss.xml" aria-label="RSS" className="rounded-full border border-navy-500 p-2 hover:border-gold-500 hover:text-gold-500">
              <Rss size={16} />
            </a>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-navy-300">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-navy-100 hover:text-gold-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-navy-700">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FX生存戦略ラボ. All rights reserved.</p>
          <p className="max-w-2xl leading-relaxed">
            当サイトは投資判断の最終的な参考情報を提供するものであり、投資助言や利益を保証するものではありません。
            FX取引には元本を超える損失が生じるリスクがあります。取引の最終判断はご自身の責任で行ってください。
          </p>
        </div>
      </div>
    </footer>
  );
}
