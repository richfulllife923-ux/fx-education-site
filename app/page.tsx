import Link from "next/link";
import { Activity, ArrowRight, BookOpen, Boxes, FlaskConical, LineChart, Radar, ShieldCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import SectionHeading from "@/components/SectionHeading";
import PostCard from "@/components/PostCard";
import { PrincipleCard } from "@/components/Diagram";
import { getAllPosts } from "@/lib/posts";

export const metadata = buildMetadata({
  title: "TUTTO",
  description:
    "TUTTOは、市場がどの構造を受け入れ、どの構造を拒否したのかを可視化するために開発中のMT5 Market Structure Platformです。",
  path: "/",
});

const THEORY_POINTS = [
  "価格を予測するのではなく、採用された構造を観測する",
  "複数時間軸の役割を分け、判断の混線を減らす",
  "公開サイトでは内部アルゴリズムではなく思想と進捗を説明する",
];

const FEATURES = [
  {
    icon: Radar,
    title: "Market Observation",
    description: "市場が反応した構造、拒否した構造、保留中の構造を分けて観測する設計です。",
  },
  {
    icon: Boxes,
    title: "Layered Structure",
    description: "Execution、Swing、Structure、Macroを分離し、時間足だけに支配されない見方を目指します。",
  },
  {
    icon: ShieldCheck,
    title: "Risk First",
    description: "売買シグナルではなく、判断前に構造とリスクを確認するためのプラットフォームです。",
  },
];

export default function HomePage() {
  const latest = getAllPosts().slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-0 h-px w-[720px] -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.18),transparent_58%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
        </div>
        <div className="container-page relative grid gap-10 py-20 sm:py-28 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="eyebrow"><FlaskConical size={14} strokeWidth={1.8} /> Market Structure Observation Framework</p>
            <h1 className="max-w-4xl font-display text-5xl font-black leading-tight text-text-primary sm:text-6xl">TUTTO</h1>
            <p className="mt-5 max-w-2xl text-xl font-semibold leading-relaxed text-text-primary">
              市場を予測するのではない。<br />市場が採用した構造を観測する。
            </p>
            <p className="mt-6 max-w-2xl text-[15px] leading-8 text-text-secondary">
              TUTTOは、市場がどの構造を受け入れ、どの構造を拒否したのかを可視化するために開発中のMT5 Market Structure Platformです。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tutto-theory" className="btn-primary">TUTTO Framework <ArrowRight size={16} strokeWidth={1.8} /></Link>
              <Link href="/fibonacci" className="btn-secondary">Frameworkを見る</Link>
              <Link href="/blog" className="btn-secondary">ブログを見る</Link>
              <Link href="/tools" className="btn-ghost">開発状況</Link>
            </div>
          </div>
          <div className="relative mx-auto hidden w-full max-w-[320px] lg:block" aria-hidden="true">
            <div className="absolute inset-8 rounded-full bg-[rgba(59,130,246,0.10)] blur-3xl" />
            <img
              src="/images/brand/tutto-geometry-ring.png"
              alt=""
              className="relative h-auto w-full rounded-full border border-border opacity-80 shadow-card"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <SectionHeading eyebrow="About" title="TUTTO Framework" description="TUTTOは、売買ボタンを押すためのEAではなく、チャート上で市場構造を観測し、トレーダーが計画を立てるためのフレームワークです。" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <PrincipleCard key={feature.title} icon={feature.icon} title={feature.title} description={feature.description} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16 sm:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeading eyebrow="Theory" title="Framework" description="TUTTO Frameworkは、未来価格を断定するものではありません。観測対象を明確にし、どの構造が市場に扱われているかを整理します。" />
          <div className="space-y-3">
            {THEORY_POINTS.map((point, index) => (
              <div key={point} className="card flex gap-4 p-5">
                <span className="font-display text-lg font-black text-primary">0{index + 1}</span>
                <p className="text-sm leading-7 text-text-secondary">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <SectionHeading eyebrow="Features" title="特徴" description="派手な予測表示ではなく、構造、状態、計画を読みやすく分けて表示することを重視しています。" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <PrincipleCard icon={LineChart} title="構造の可視化" description="価格帯、波、状態を分け、チャート上で判断の根拠を見えるようにします。" />
          <PrincipleCard icon={Activity} title="状態管理" description="採用、拒否、保留といった市場反応を観測し、判断の前提を整理します。" tone="success" />
          <PrincipleCard icon={BookOpen} title="学習可能な設計" description="ブラックボックスではなく、何を見ているのかを理解できるUIを目指します。" tone="warning" />
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Latest" title="ブログ最新記事" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {latest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/blog" className="btn-primary">ブログを見る <ArrowRight size={16} strokeWidth={1.8} /></Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <p className="eyebrow">Development</p>
            <h2 className="text-2xl font-bold text-text-primary">開発状況</h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              MT5向けの市場構造観測プラットフォームとして、Framework、アーキテクチャ、表示レイヤーを段階的に構築しています。一般公開前の内部ロジックは掲載しません。
            </p>
            <Link href="/tools" className="btn-secondary mt-6">進捗を見る</Link>
          </div>
          <div className="card p-6 sm:p-8">
            <p className="eyebrow">Coming Soon</p>
            <h2 className="text-2xl font-bold text-text-primary">Indicator</h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              TUTTO Indicatorは開発中です。購入ボタンや配布導線は、検証と公開準備が整うまで追加しません。
            </p>
          </div>
        </div>
      </section>
    </>
  );
}