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
        {/* 検索 */}
        <div className="mb-6 flex items-center gap-2 rounded-pill border border-line bg-white px-4 py-2.5">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="記事を検索（例：ロット、ゼロカット）"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>

        {/* カテゴリタブ */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => selectCategory(undefined)}
            className={`rounded-pill px-4 py-1.5 text-xs font-semibold transition-colors ${
              !activeCategory ? "bg-navy-900 text-white" : "border border-line text-navy-700 hover:border-navy-500"
            }`}
          >
            すべて
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => selectCategory(c)}
              className={`rounded-pill px-4 py-1.5 text-xs font-semibold transition-colors ${
                activeCategory === c ? "bg-navy-900 text-white" : "border border-line text-navy-700 hover:border-navy-500"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 記事グリッド */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {pagePosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        {pagePosts.length === 0 && <p className="mt-10 text-sm text-muted">該当する記事が見つかりませんでした。</p>}

        {/* ページネーション */}
        {totalPages > 1 && (
          <nav className="mt-12 flex justify-center gap-2" aria-label="ページネーション">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  n === safePage ? "bg-navy-900 text-white" : "border border-line text-navy-700 hover:border-navy-500"
                }`}
              >
                {n}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* サイドバー */}
      <aside className="space-y-8">
        <div className="card p-5">
          <h3 className="mb-4 font-display text-sm font-bold text-navy-900">人気記事</h3>
          <ul className="space-y-4">
            {popular.map((p, i) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="flex items-start gap-3 group">
                  <span className="font-display text-lg font-black text-gold-500">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-sm font-medium leading-snug text-navy-700 group-hover:text-gold-600">{p.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-display text-sm font-bold text-navy-900">カテゴリー</h3>
          <ul className="space-y-2">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <button onClick={() => selectCategory(c)} className="text-sm text-navy-700 hover:text-gold-600">
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
