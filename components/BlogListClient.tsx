"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import PostCard from "@/components/PostCard";
import { CATEGORIES, getAllPosts, getPopularPosts, type Category } from "@/lib/posts";

const PAGE_SIZE = 6;

export default function BlogListClient() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as Category | null) ?? undefined;
  const initialPage = Number(searchParams.get("page") ?? "1");

  const [activeCategory, setActiveCategory] = useState<Category | undefined>(initialCategory);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(initialPage || 1);

  const allPosts = useMemo(() => getAllPosts(), []);
  const popular = useMemo(() => getPopularPosts(4), []);

  const filtered = useMemo(() => {
    let list = allPosts;
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allPosts, activeCategory, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagePosts = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function selectCategory(c: Category | undefined) {
    setActiveCategory(c);
    setCurrentPage(1);
  }

  return (
    <section className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-6 flex items-center gap-2 rounded-button border border-border bg-surface px-4 py-2.5">
          <Search size={16} className="text-text-secondary" strokeWidth={1.8} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="記事を検索"
            className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
          />
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => selectCategory(undefined)}
            className={`rounded-button px-4 py-1.5 text-xs font-semibold transition-colors ${
              !activeCategory ? "bg-primary text-white" : "border border-border text-text-secondary hover:border-primary hover:text-text-primary"
            }`}
          >
            すべて
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => selectCategory(c)}
              className={`rounded-button px-4 py-1.5 text-xs font-semibold transition-colors ${
                activeCategory === c ? "bg-primary text-white" : "border border-border text-text-secondary hover:border-primary hover:text-text-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {pagePosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        {pagePosts.length === 0 && <p className="mt-10 text-sm text-text-secondary">該当する記事が見つかりませんでした。</p>}

        {totalPages > 1 && (
          <nav className="mt-12 flex justify-center gap-2" aria-label="ページネーション">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`flex h-9 w-9 items-center justify-center rounded-button text-sm font-semibold transition-colors ${
                  n === safePage ? "bg-primary text-white" : "border border-border text-text-secondary hover:border-primary hover:text-text-primary"
                }`}
              >
                {n}
              </button>
            ))}
          </nav>
        )}
      </div>

      <aside className="space-y-8">
        <div className="card p-5">
          <h3 className="mb-4 font-display text-sm font-bold text-text-primary">よく読まれている記事</h3>
          <ul className="space-y-4">
            {popular.map((p, i) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group flex items-start gap-3">
                  <span className="font-display text-lg font-black text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-sm font-medium leading-snug text-text-secondary group-hover:text-text-primary">{p.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-display text-sm font-bold text-text-primary">カテゴリー</h3>
          <ul className="space-y-2">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <button onClick={() => selectCategory(c)} className="text-sm text-text-secondary hover:text-text-primary">
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </section>
  );
}
