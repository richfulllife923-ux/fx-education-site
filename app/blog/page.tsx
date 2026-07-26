import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import BlogListClient from "@/components/BlogListClient";

export const metadata = buildMetadata({
  title: "ブログ一覧",
  description: "資金管理・TUTTO理論・フィボナッチ・海外FXなど、FX初心者向けの記事一覧です。カテゴリやタグから記事を探せます。",
  path: "/blog",
});

export default function BlogListPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "ブログ", path: "/blog" }]} />

      <section className="container-page pt-6">
        <SectionHeading eyebrow="Articles" title="ブログ一覧" description="カテゴリやキーワードから、学びたいテーマの記事を探せます。" />
      </section>

      {/* useSearchParams はクライアント側でのみ実行されるため Suspense で囲む（静的エクスポート対応） */}
      <Suspense fallback={null}>
        <BlogListClient />
      </Suspense>
    </div>
  );
}
