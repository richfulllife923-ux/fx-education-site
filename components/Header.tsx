"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";

const NAV_LINKS = [
  { href: "/fund-management", label: "資金管理" },
  { href: "/tutto-theory", label: "TUTTO理論" },
  { href: "/fx-basics", label: "FX基礎知識" },
  { href: "/fibonacci", label: "フィボナッチ" },
  { href: "/overseas-fx", label: "海外FX" },
  { href: "/tools", label: "おすすめツール" },
  { href: "/blog", label: "ブログ" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-navy-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm text-gold-300">
            生
          </span>
          FX生存戦略ラボ
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-navy-700 transition-colors hover:text-gold-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/blog" aria-label="サイト内検索" className="rounded-full p-2 text-navy-500 hover:bg-surface">
            <Search size={18} />
          </Link>
          <Link href="/contact" className="btn-primary">
            お問い合わせ
          </Link>
        </div>

        <button
          className="rounded-full p-2 text-navy-900 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-white px-5 py-4 lg:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-navy-700 hover:bg-surface"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-line pt-3">
              <Link href="/profile" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-muted">
                プロフィール
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-muted">
                お問い合わせ
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
