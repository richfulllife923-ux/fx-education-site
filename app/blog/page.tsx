import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import BlogListClient from "@/components/BlogListClient";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "ブログ",
  description: "TUTTOの市場構造観測、資金管理、開発状況に関する記事一覧です。",
  path: "/blog",
});

export default function BlogListPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "ブログ", path: "/blog" }]} />
      <section className="container-page pt-6">
        <SectionHeading eyebrow="Articles" title="ブログ" description="TUTTOの考え方、開発状況、市場構造を読むための基礎をまとめています。" />
      </section>
      <Suspense fallback={null}>
        <BlogListClient />
      </Suspense>
    </div>
  );
}
