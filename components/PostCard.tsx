import Link from "next/link";
import { Clock } from "lucide-react";
import type { Post } from "@/lib/posts";

export default function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`card group flex flex-col overflow-hidden ${featured ? "sm:col-span-2" : ""}`}>
      <div
        className={`w-full bg-gradient-to-br from-navy-700 to-navy-900 ${featured ? "aspect-[21/9]" : "aspect-[16/10]"}`}
        aria-hidden
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="badge w-fit">{post.category}</span>
        <h3 className="font-display text-lg font-bold leading-snug text-navy-900 group-hover:text-gold-600">
          {post.title}
        </h3>
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
        <div className="flex items-center gap-3 text-xs text-muted">
          <time dateTime={post.publishedAt}>{post.publishedAt}</time>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {post.readingMinutes}分で読める
          </span>
        </div>
      </div>
    </Link>
  );
}
