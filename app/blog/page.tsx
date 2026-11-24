import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import BlogListClient from "@/components/BlogListClient";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "ブログ",
  description: "TUTTOの基礎知識と開発ログの記事一覧です。",
  path: "/blog",
});

export default function BlogListPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "ブログ", path: "/blog" }]} />
      <section className="container-page pt-6">
        <SectionHeading eyebrow="Articles" title="ブログ" description="TUTTOの考え方、開発状況、市場構造を読むための基礎をまとめています。" />
      </section>
      <section className="container-page pt-2 pb-4">
        <div className="card p-5 sm:p-7" style={{ borderWidth: "1px", borderColor: "rgba(236, 72, 153, 0.62)", background: "linear-gradient(115deg, rgba(236,72,153,0.14), #182238 42%, #111827 100%)", boxShadow: "0 16px 44px -28px rgba(236, 72, 153, 0.36)" }}>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <p className="eyebrow mb-0 text-pink-300">TUTTO on note</p>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-text-primary sm:text-3xl">読み物はnoteでも公開しています</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">
                ブログの基礎知識に加えて、noteでは「週足×三尊×レバレッジなし」のシンプル取引術など、忙しい人向けの読み物を公開しています。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a href="https://note.com/tutto_tradinglab" target="_blank" rel="noopener noreferrer" className="main-cta cta-note whitespace-nowrap">
                noteで読む <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>
      <Suspense fallback={null}>
        <BlogListClient />
      </Suspense>
    </div>
  );
}
