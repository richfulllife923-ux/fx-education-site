import Link from "next/link";
import { ArrowRight, BookOpen, Building2, ExternalLink, FlaskConical, LineChart, PlayCircle, Radar, ShieldCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import SectionHeading from "@/components/SectionHeading";
import NumericHeroParticles from "@/components/NumericHeroParticles";

export const metadata = buildMetadata({
  title: "TUTTO",
  description:
    "TUTTOは市場構造を観測する分析フレームワークです。企業の決算・財務・成長性を毎日調査するTUTTO市場分析も公開しています。",
  path: "/",
});

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
    href: "/framework/philosophy",
    cta: "Frameworkを読む",
  },
];

export default function HomePage() {
  return (
    <>
      <NumericHeroParticles />
      <section data-home-hero className="relative overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-0 h-px w-[720px] -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.18),transparent_58%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
        </div>
        <div className="container-page relative grid gap-8 py-16 sm:py-20 md:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] md:items-center lg:gap-10">
          <div data-hero-text className="relative z-10 min-w-0">
            <p className="eyebrow"><FlaskConical size={14} strokeWidth={1.8} /> Market Structure Observation Framework</p>
            <h1 className="max-w-4xl font-display text-5xl font-black leading-tight text-text-primary sm:text-6xl">TUTTO</h1>
            <p className="mt-5 max-w-2xl text-xl font-semibold leading-relaxed text-text-primary">
              市場を予測するのではない。<br />市場が採用した構造を観測する。
            </p>
            <p className="mt-6 max-w-2xl text-[15px] leading-8 text-text-secondary">
              TUTTOは、市場がどの構造を受け入れ、どの構造を拒否したのかを可視化するために開発中のMT5 Market Structure Platformです。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/stock-analysis/watchlist/#daily-analysis-heading" className="main-cta cta-stock">
                毎日更新の市場分析を見る
              </Link>
              <Link href="/manifesto" className="main-cta cta-manifesto">Manifestoを見る <ArrowRight size={16} strokeWidth={1.8} /></Link>
              <Link href="/blog" className="main-cta cta-manifesto">ブログを見る <ArrowRight size={16} /></Link>
              <Link href="/tools" className="main-cta cta-manifesto">開発状況 <ArrowRight size={16} /></Link>
            </div>
          </div>
          <div data-hero-visual className="relative mx-auto w-full max-w-[380px] overflow-hidden rounded-card bg-[#030a1c] md:mx-0 md:max-w-none">
            <img
              src="/images/tutto-hero-geometry.jpg"
              alt="TUTTO geometry and mathematical structure visual"
              width={576}
              height={1024}
              fetchPriority="high"
              className="block h-[420px] w-full object-cover object-right saturate-[0.85] brightness-90 sm:h-[500px] md:h-[580px] lg:h-[620px]"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,10,28,0.95)_0%,rgba(3,10,28,0.88)_28%,rgba(3,10,28,0.72)_48%,rgba(3,10,28,0.38)_68%,rgba(3,10,28,0.12)_100%)]"/>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,16,32,0.25)_0%,transparent_24%,transparent_78%,rgba(11,16,32,0.7)_100%)]"/>
          </div>
        </div>
      </section>

      <section className="container-page py-8 sm:py-10" aria-labelledby="main-manifesto-heading">
        <div className="card overflow-hidden p-5 sm:p-7" style={{ borderWidth: "1px", borderColor: "rgba(217, 164, 65, 0.55)", background: "linear-gradient(120deg, rgba(217,164,65,0.12), #182238 45%, #111827 100%)", boxShadow: "0 16px 44px -28px rgba(217, 164, 65, 0.35)" }}>
          <img
            src="/images/tutto-main-manifesto.jpg"
            alt="TUTTO — すべての人に、資産を。TUTTO INVESTMENT PHILOSOPHY"
            width={680}
            height={383}
            className="block w-full rounded-card object-cover"
          />
          <p className="eyebrow mb-0 mt-7" style={{ color: "#e7c26a" }}>Main Manifesto</p>
          <h2 id="main-manifesto-heading" className="mt-3 text-2xl font-bold leading-tight text-text-primary sm:text-3xl">TUTTO — すべての人に、資産を。</h2>
          <p className="mt-2 font-display text-sm font-black uppercase tracking-[0.18em]" style={{ color: "#e7c26a" }}>TUTTO Investment Philosophy</p>
          <div className="mt-5 space-y-4 text-sm leading-8 text-text-secondary sm:text-base">
            <p>TUTTO はイタリア語で「すべて」「全体」を意味する。</p>
            <p>この名前には、資産を持つ一部の人だけでなく、すべての人に資産形成の知識と機会を届けたいという理念を込める。資本の優位性を知るこの資本の非対称性が、富の格差を維持・拡大させる要因の一つとなっている。</p>
          </div>
          <h3 className="mt-8 text-xl font-bold text-text-primary">TUTTOが目指すもの</h3>
          <div className="mt-4 space-y-4 text-sm leading-8 text-text-secondary sm:text-base">
            <p>TUTTOは富裕層だけの投資術ではない。</p>
            <p>資産を持たない人が資産を持つ側へ移行するために、経済の仕組みを学び、投資のリスクを理解し、少額からでも資本を築く方法を研究する。</p>
          </div>
          <div className="mt-6 rounded-card border p-5" style={{ borderColor: "rgba(217,164,65,0.45)", background: "rgba(217,164,65,0.07)" }}>
            <p className="text-sm leading-8 text-text-primary sm:text-base">1億円の資産を持つ人は、わずか1%の利益で100万円を得られる。</p>
            <p className="mt-2 text-sm leading-8 text-text-primary sm:text-base">一方、100万円しか持たない人が同じ100万円を得るには、100%の利益が必要になる。</p>
          </div>
          <div className="mt-6 space-y-4 text-sm leading-8 text-text-secondary sm:text-base">
            <p>同じ市場に参加していても、資本の規模によって利益を得るための条件は大きく異なる。投資とは、一度の勝負で大金を得ることではない。</p>
            <p>資産を守り、育て、次の世代へつなぐための知識と実践である。</p>
            <p>私たちは、誰もが必ず富裕層になれるとは約束しない。</p>
            <p>しかし、生まれた環境や現在の資産額だけで、経済的な未来が決まるべきではないと考える。TUTTO — すべての人に、資産を。</p>
          </div>
          <p className="mt-8 font-display text-base font-black tracking-[0.14em] text-text-primary">Knowledge for All. Opportunity for All.</p>
          <p className="mt-3 text-sm font-semibold leading-8 text-text-primary sm:text-base">予測より観測。感覚より検証。そして、すべての人に資産形成の機会を。</p>
        </div>
      </section>

      <section className="container-page py-8 sm:py-10">
        <div className="card p-5 sm:p-7" style={{ borderWidth: "1px", borderColor: "rgba(16, 185, 129, 0.62)", background: "linear-gradient(115deg, rgba(16,185,129,0.14), #182238 42%, #111827 100%)", boxShadow: "0 16px 44px -28px rgba(16, 185, 129, 0.36)" }}>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow mb-0 text-emerald-300">TUTTO MARKET ANALYSIS</p>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />TUTTOが毎日更新
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-text-primary sm:text-3xl">TUTTO 市場分析</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">
                TUTTOが企業の決算・財務・成長性・企業価値・リスクを毎日調査し、確認できた事実と今後の観測点を公開します。
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-text-secondary">
                注目5銘柄と、企業の変化を追う毎日の分析を同じページでご覧いただけます。予測ではなく、開示情報に基づく観測をお届けします。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/stock-analysis/watchlist/#daily-analysis-heading" className="main-cta cta-stock whitespace-nowrap">
                毎日の市場分析を見る
              </Link>
              <Link href="/stock-analysis/watchlist/#ranking-heading" className="btn-secondary whitespace-nowrap">
                注目5銘柄を見る
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-8 sm:py-10">
        <div className="card bg-surface/70 p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="eyebrow"><Building2 size={14} strokeWidth={1.8} /> Broker Selection</p>
              <h2 className="text-2xl font-bold leading-tight text-text-primary sm:text-3xl">FX会社を選ぶ</h2>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-text-secondary">
                取引環境やサービス内容はFX会社によって異なります。プラットフォームや取引条件を確認し、自分に合った環境を比較できます。
              </p>
            </div>
            <Link href="/brokers" className="main-cta cta-broker">
              FX会社を比較する <ArrowRight size={18} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-10 pb-16 sm:py-14 sm:pb-24">
        <div className="card border-primary bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(21,28,46,0.88)_44%,rgba(11,16,32,0.96))] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="eyebrow"><LineChart size={14} strokeWidth={1.8} /> TUTTO Indicator</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-text-primary sm:text-4xl">インジケーター</h2>
              <p className="mt-3 font-display text-sm font-black uppercase tracking-[0.18em] text-primary">ENTRY / MICRO / CNN F&G</p>
              <p className="mt-5 text-sm leading-8 text-text-secondary">
                TUTTO Indicatorで表示される主要な確認項目を、公開可能な範囲で整理しています。詳しい表示例はParametersページで確認できます。
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/indicator" className="main-cta cta-indicator">
                Indicatorを見る <ArrowRight size={16} strokeWidth={1.8} />
              </Link>
              <Link href="/indicator/install" className="main-cta cta-indicator">
                MT5へのインストール方法 <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-card border border-primary/40 bg-background/55 p-4">
              <p className="font-display text-xs font-black uppercase tracking-[0.16em] text-primary">ENTRY</p>
              <h3 className="mt-3 text-sm font-bold leading-6 text-text-primary">中長期エントリーの発生確率</h3>
            </div>
            <div className="rounded-card border border-primary/40 bg-background/55 p-4">
              <p className="font-display text-xs font-black uppercase tracking-[0.16em] text-primary">MICRO</p>
              <h3 className="mt-3 text-sm font-bold leading-6 text-text-primary">短期エントリーの発生確率</h3>
            </div>
            <div className="rounded-card border border-danger/50 bg-background/55 p-4">
              <p className="font-display text-xs font-black uppercase tracking-[0.16em] text-danger">CNN F&G</p>
              <h3 className="mt-3 text-sm font-bold leading-6 text-text-primary">Fear / Greed環境の確認</h3>
            </div>
          </div>
          <p className="mt-6 border-t border-border pt-5 text-xs leading-6 text-text-secondary">
            ENTRY / MICROの確率表示は、将来の値動きや利益を保証するものではありません。TUTTO Indicatorによる市場構造の観測結果を確認するための補助表示です。
          </p>
        </div>
      </section>

      <section className="container-page pb-12 sm:pb-16">
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

      <section className="container-page py-16 sm:py-24">
        <SectionHeading
          eyebrow="Distribution"
          title="X / YouTube / Website"
          titleClassName="text-lime-400"
          description="TUTTOの公開活動は、現在の観測、検証の説明、公式Documentationを分けて記録します。"
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
                        {role.cta} <ArrowRight size={15} strokeWidth={1.8} />
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

    </>
  );
}
