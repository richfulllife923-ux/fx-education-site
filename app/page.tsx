import Link from "next/link";
import { Wallet, LineChart, BookOpen, TrendingUp, ArrowRight, ShieldCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import SectionHeading from "@/components/SectionHeading";
import PostCard from "@/components/PostCard";
import { PrincipleCard } from "@/components/Diagram";
import { getAllPosts, getPopularPosts } from "@/lib/posts";

export const metadata = buildMetadata({
  title: "勝率ではない。生き残った人だけが勝者になる。",
  description:
    "FX初心者が安心して学べる教育サイト『FX生存戦略ラボ』。資金管理・TUTTO理論・フィボナッチ構造分析をやさしく体系的に解説します。",
  path: "/",
});

const PILLARS = [
  {
    href: "/fund-management",
    icon: Wallet,
    title: "資金管理とは",
    description: "大きく負けないこと。追加入金しないこと。生存率を左右する7つの原則を解説します。",
  },
  {
    href: "/tutto-theory",
    icon: LineChart,
    title: "TUTTO理論とは",
    description: "市場の受容度と構造転換を5段階で読み解く、当サイト独自の分析フレームワーク。",
  },
  {
    href: "/fx-basics",
    icon: BookOpen,
    title: "初心者向け記事",
    description: "レバレッジ・スプレッド・ゼロカットなど、基礎用語を一つずつ丁寧に解説します。",
  },
  {
    href: "/blog",
    icon: TrendingUp,
    title: "人気記事",
    description: "多くの読者に読まれている記事をピックアップ。まずはここから始めるのもおすすめです。",
  },
];

export default function HomePage() {
  const latest = getAllPosts().slice(0, 3);
  const popular = getPopularPosts(3);

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(201,169,97,0.25), transparent 40%), radial-gradient(circle at 80% 60%, rgba(91,155,213,0.25), transparent 45%)",
          }}
          aria-hidden
        />
        <div className="container-page relative py-20 sm:py-28">
          <span className="eyebrow text-gold-400">
            <ShieldCheck size={14} /> FX SURVIVAL LAB
          </span>
          <h1 className="max-w-3xl font-display text-4xl font-black leading-[1.25] sm:text-5xl sm:leading-[1.25]">
            勝率ではない。
            <br />
            生き残った人だけが、
            <br />
            <span className="text-gold-400">勝者</span>になる。
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-navy-100">
            一時的な勝率の高さは、資金を守れるかどうかを保証しません。
            当サイトは「どう勝つか」ではなく「どう生き残るか」を軸に、
            FX初心者が安心して学べる知識を体系的にまとめています。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/fund-management" className="btn-gold">
              資金管理から学ぶ <ArrowRight size={16} />
            </Link>
            <Link href="/tutto-theory" className="btn-ghost border-navy-300 text-white hover:border-gold-400 hover:text-gold-400">
              TUTTO理論を見る
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Pillars ===== */}
      <section className="container-page py-16 sm:py-24">
        <SectionHeading
          eyebrow="Start Here"
          title="何から学べばいいか、迷わないために"
          description="サイトの全体構成は、資金管理を起点に段階的に理解が深まるよう設計されています。"
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <Link key={p.href} href={p.href} className="group">
              <PrincipleCard icon={p.icon} title={p.title} description={p.description} />
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Latest posts ===== */}
      <section className="bg-surface py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Latest" title="新着記事" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {latest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/blog" className="btn-primary">
              記事一覧を見る <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Popular posts ===== */}
      <section className="container-page py-16 sm:py-24">
        <SectionHeading eyebrow="Popular" title="よく読まれている記事" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {popular.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </>
  );
}
