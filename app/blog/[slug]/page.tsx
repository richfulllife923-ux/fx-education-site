import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Twitter, Facebook, Link as LinkIcon } from "lucide-react";
import { buildMetadata, articleJsonLd, site } from "@/lib/seo";
import Breadcrumb from "@/components/Breadcrumb";
import PostCard from "@/components/PostCard";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/posts";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return buildMetadata({ title: "記事が見つかりません", path: `/blog/${slug}` });

  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    tags: post.tags,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post);
  const jsonLd = articleJsonLd({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: `${site.url}${post.coverImage}`,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    authorName: post.author,
  });

  const shareUrl = `${site.url}/blog/${post.slug}`;

  return (
    <article className="pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb items={[{ name: "ブログ", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]} />

      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
        <div>
          <header className="mb-8">
            <span className="badge mb-4">{post.category}</span>
            <h1 className="font-display text-3xl font-black leading-snug text-navy-900 sm:text-4xl">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
              <span>著者：{post.author}</span>
              <time dateTime={post.publishedAt}>公開日：{post.publishedAt}</time>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {post.readingMinutes}分で読める
              </span>
            </div>
          </header>

          <div className="aspect-[16/9] w-full rounded-card bg-gradient-to-br from-navy-700 to-navy-900" aria-hidden />

          <div className="prose prose-navy mt-8 max-w-none text-[15px] leading-8 text-navy-700">
            <p>{post.content}</p>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-pill bg-surface px-3 py-1 text-xs text-navy-700">
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-2 border-t border-line pt-6">
            <span className="text-xs font-semibold text-muted">シェア：</span>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
              className="rounded-full border border-line p-2 hover:border-navy-500"
              aria-label="Xでシェア"
            >
              <Twitter size={14} />
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              className="rounded-full border border-line p-2 hover:border-navy-500"
              aria-label="Facebookでシェア"
            >
              <Facebook size={14} />
            </a>
            <span className="rounded-full border border-line p-2 text-muted">
              <LinkIcon size={14} />
            </span>
          </div>
        </div>

        <aside>
          <div className="card sticky top-24 p-5">
            <h3 className="mb-4 font-display text-sm font-bold text-navy-900">関連記事</h3>
            <ul className="space-y-4">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/blog/${r.slug}`} className="text-sm font-medium leading-snug text-navy-700 hover:text-gold-600">
                    {r.title}
                  </Link>
                </li>
              ))}
              {related.length === 0 && <li className="text-sm text-muted">関連記事はまだありません。</li>}
            </ul>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-page mt-16">
          <h2 className="mb-6 font-display text-xl font-bold text-navy-900">こちらの記事もおすすめです</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {related.map((r) => (
              <PostCard key={r.slug} post={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
