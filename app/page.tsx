import Link from "next/link";
import { Activity, ArrowRight, BookOpen, Boxes, ExternalLink, FlaskConical, LineChart, PlayCircle, Radar, ShieldCheck } from "lucide-react";
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

const EVIDENCE_FLOW = [
  { label: "PRE-OBSERVATION", description: "先出し観測" },
  { label: "MARKET REACTION", description: "市場反応" },
  { label: "RUNTIME EVIDENCE", description: "経過記録" },
  { label: "ANSWER CHECK", description: "答え合わせ" },
  { label: "STRUCTURE VERIFICATION", description: "構造検証" },
];

const DISTRIBUTION_ROLES = [
  {
    icon: Radar,
    title: "X — Current Observation",
    description: "短い市場構造観測、経過観測、答え合わせ、Runtime Evidenceの抜粋を公開します。",
    keywords: ["Fast", "Current", "Visual", "Evidence-driven"],
    href: "https://x.com/Tutto249306",
    cta: "Xで観測を見る",
    external: true,
  },
  {
    icon: PlayCircle,
    title: "YouTube — Explanation & Verification",
    description: "Xで短く公開した観測について、なぜそのStructureやGeometryを見ていたのか、その後市場がどう扱ったのかを詳しく解説・検証する場所です。",
    keywords: ["WHY", "Verification", "Case Study", "Education"],
    cta: "Coming soon",
  },
  {
    icon: BookOpen,
    title: "Website — Documentation",
    description: "TUTTOのPhilosophy、Structure Theory、Market Layer、STATE、Trade Planを体系的に記録する公式Documentationです。",
    keywords: ["SSOT", "Framework", "Research Archive", "Reference"],
    href: "/framework",
    cta: "Frameworkを読む",
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
              <Link href="/manifesto" className="btn-primary">Manifestoを読む <ArrowRight size={16} strokeWidth={1.8} /></Link>
              <Link href="/framework" className="btn-secondary">Frameworkを見る</Link>
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

      <section className="container-page py-12 sm:py-16">
        <div className="card border-primary p-6 sm:p-8">
          <p className="eyebrow"><ShieldCheck size={14} strokeWidth={1.8} /> Important Notice</p>
          <h2 className="mt-3 text-2xl font-bold text-text-primary">TUTTOは投資助言ではありません。</h2>
          <div className="mt-4 space-y-3 text-sm leading-8 text-text-secondary">
            <p>
              TUTTOで公開しているFramework、Indicator、動画、ライブ配信、記事、その他の情報は、市場構造を観測し学習するための教育・研究目的の情報です。特定の金融商品の売買、投資判断、エントリー、決済、利益を指示または保証するものではありません。
            </p>
            <p>
              TUTTOは、売買シグナル、自動売買命令、投資助言、利益保証を提供しません。表示される情報や解説は、判断材料を整理するための補助であり、最終的な判断と責任は利用者自身にあります。
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16 sm:py-24">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <div>
              <p className="eyebrow"><Radar size={14} strokeWidth={1.8} /> OBSERVATION → EVIDENCE</p>
              <h2 className="max-w-2xl text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
                先に観測し、<br />市場の反応を後から検証する。
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-8 text-text-secondary">
                <p>
                  TUTTOは、市場が動いた後に「ここが重要だった」と説明するためのFrameworkではありません。
                </p>
                <p>
                  市場の結果がまだ分からない段階でStructureやGeometryの観測ポイントを記録し、その後に市場が実際にどう扱ったかを確認します。
                </p>
                <p>
                  未来価格を保証するのではなく、市場がどの構造を採用したかを観測・検証します。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
              {EVIDENCE_FLOW.map((step, index) => (
                <div key={step.label} className="card relative p-4 sm:min-h-[150px]">
                  <span className="font-display text-xs font-black text-primary">0{index + 1}</span>
                  <h3 className="mt-4 text-sm font-bold leading-6 text-text-primary">{step.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <SectionHeading
          eyebrow="Distribution"
          title="X / YouTube / Website"
          description="TUTTOの公開活動は、現在の観測、検証の説明、公式Documentationを分けて記録します。Indicatorは、そのFrameworkをChart上で観測するためのToolです。"
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {DISTRIBUTION_ROLES.map((role) => {
            const Icon = role.icon;

            return (
              <div key={role.title} className="card flex h-full flex-col p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-button border border-primary bg-[rgba(59,130,246,0.10)] text-primary">
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-text-primary">{role.title}</h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{role.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {role.keywords.map((keyword) => (
                    <span key={keyword} className="badge">{keyword}</span>
                  ))}
                </div>
                <div className="mt-auto pt-6">
                  {role.href ? (
                    role.external ? (
                      <a href={role.href} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                        {role.cta} <ExternalLink size={15} strokeWidth={1.8} aria-hidden="true" />
                      </a>
                    ) : (
                      <Link href={role.href} className="btn-secondary">
                        {role.cta} <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                      </Link>
                    )
                  ) : (
                    <span className="badge">{role.cta}</span>
                  )}
                </div>
              </div>
            );
          })}
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
