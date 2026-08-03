"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "HOME" },
  { href: "/framework", label: "Framework" },
  { href: "/research", label: "Research" },
  { href: "/indicator", label: "Indicator" },
  { href: "/roadmap", label: "Roadmap" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-display text-lg font-bold text-text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-primary">◉</span>
          <span>TUTTO</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="メインナビゲーション">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/blog" className="btn-ghost">
            Blog
          </Link>
          <Link href="/contact" className="btn-secondary">
            Contact
          </Link>
        </div>

        <button className="rounded-button p-2 text-text-primary lg:hidden" onClick={() => setOpen((v) => !v)} aria-label={open ? "メニューを閉じる" : "メニューを開く"}>
          {open ? <X size={22} strokeWidth={1.8} /> : <Menu size={22} strokeWidth={1.8} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-5 py-4 lg:hidden" aria-label="モバイルナビゲーション">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setOpen(false)} className="block rounded-button px-3 py-2.5 text-[15px] font-medium text-text-secondary hover:bg-surface hover:text-text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-border pt-3">
              <Link href="/blog" onClick={() => setOpen(false)} className="block rounded-button px-3 py-2.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary">
                Blog
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)} className="block rounded-button px-3 py-2.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}