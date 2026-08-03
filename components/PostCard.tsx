import Link from "next/link";
import { Clock } from "lucide-react";
import type { Post } from "@/lib/posts";

export default function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`card group flex flex-col overflow-hidden ${featured ? "sm:col-span-2" : ""}`}>
      <div className={`w-full border-b border-border bg-[linear-gradient(135deg,rgba(59,130,246,0.28),rgba(21,28,46,0.85))] ${featured ? "aspect-[21/9]" : "aspect-[16/10]"}`} aria-hidden />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="badge w-fit">{post.category}</span>
        <h3 className="font-display text-lg font-bold leading-snug text-text-primary group-hover:text-primary">{post.title}</h3>
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-text-secondary">{post.excerpt}</p>
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <time dateTime={post.publishedAt}>{post.publishedAt}</time>
          <span className="flex items-center gap-1">
            <Clock size={12} strokeWidth={1.8} /> {post.readingMinutes}分
          </span>
        </div>
      </div>
    </Link>
  );
}
