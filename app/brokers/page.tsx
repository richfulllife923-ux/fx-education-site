import { ArrowUpRight, Building2, CheckCircle2, CreditCard, Headphones, Landmark, MonitorCog, ShieldAlert, SlidersHorizontal } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FX会社を選ぶ",
  description: "FX会社の取引環境やサービス内容を比較し、自分の取引方法に合ったサービスを選ぶためのTUTTOガイド。",
  path: "/brokers",
});

const BROKERS = [
  {
    name: "Vantage Trading",
    description: "MT4 / MT5を利用した取引環境を確認したい人向けの比較候補です。FX / CFD等を提供し、デモ取引にも対応しています。",
    platform: "MT4 / MT5",
    characteristics: ["FX / CFD等を提供", "デモ取引対応", "取引条件は公式情報で確認"],
    href: "https://www.vantagetradings.com/open-live-account/?utm_source=promo&utm_medium=social&utm_campaign=RAF&utm_term=NA&utm_content=NA&c=yLNWzY8SMiiQdekrxIQBUQ==",
    cta: "Vantage Tradingを見る",
    tone: "blue",
  },
  {
    name: "FXGT",
    description: "MT5を中心に、口座タイプによってMT4 / MT5対応も確認できる比較候補です。複数の口座タイプと幅広い取扱商品があります。",
    platform: "MT5 / 一部口座でMT4・MT5対応",
    characteristics: ["複数の口座タイプ", "FX / 株価指数 / 貴金属 / エネルギー / 株式等", "条件は口座タイプや地域等で異なる"],
    href: "https://fxgt.link/register?utm_campaign=c33525",
    cta: "FXGTを見る",
    tone: "green",
  },
] as const;

const CHECKPOINTS = [
  {
    icon: MonitorCog,
    title: "取引プラットフォーム",
    description: "自分が使用したい取引環境に対応しているか確認する。",
  },
  {
    icon: SlidersHorizontal,
    title: "取引条件",
    description: "スプレッド、手数料、最低取引数量、レバレッジなどは会社や口座タイプによって異なる。",
  },
  {
    icon: CreditCard,
    title: "入出金",
    description: "対応方法、手数料、処理時間等を確認する。",
  },
  {
    icon: Headphones,
    title: "サポート",
    description: "日本語対応や問い合わせ方法を確認する。",
  },
  {
    icon: Landmark,
    title: "運営・規制情報",
    description: "利用するサービスを提供する法人、規制・ライセンス、利用規約等を自分で確認する。",
  },
] as const;

const HERO_POINTS = ["比較して選ぶ", "自分に合う環境を確認", "公式情報を確認"] as const;

const TONE_STYLES = {
  blue: {
    card: "border-primary shadow-[0_0_44px_rgba(59,130,246,0.20)]",
    hero: "border-primary bg-[linear-gradient(135deg,rgba(59,130,246,0.24),rgba(59,130,246,0.08)_42%,rgba(11,16,32,0)_100%)]",
    panel: "border-primary bg-[rgba(59,130,246,0.10)]",
    icon: "border-primary bg-[rgba(59,130,246,0.16)] text-primary shadow-[0_0_24px_rgba(59,130,246,0.22)]",
    text: "text-primary",
    divider: "bg-primary",
    button: "border-primary bg-primary text-white hover:bg-blue-500 hover:shadow-[0_0_22px_rgba(59,130,246,0.30)]",
  },
  green: {
    card: "border-success shadow-[0_0_44px_rgba(34,197,94,0.18)]",
    hero: "border-success bg-[linear-gradient(135deg,rgba(34,197,94,0.20),rgba(34,197,94,0.07)_42%,rgba(11,16,32,0)_100%)]",
    panel: "border-success bg-[rgba(34,197,94,0.10)]",
    icon: "border-success bg-[rgba(34,197,94,0.16)] text-success shadow-[0_0_24px_rgba(34,197,94,0.20)]",
    text: "text-success",
    divider: "bg-success",
    button: "border-success bg-success text-background hover:bg-green-400 hover:shadow-[0_0_22px_rgba(34,197,94,0.28)]",
  },
} as const;

export default function BrokersPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "FX会社を選ぶ", path: "/brokers" }]} />

      <section className="container-page pt-6">
        <div className="max-w-3xl">
          <p className="eyebrow"><Building2 size={14} strokeWidth={1.8} /> Broker Selection</p>
          <h1 className="font-display text-4xl font-black leading-tight text-text-primary sm:text-5xl">FX会社を選ぶ</h1>
          <p className="mt-6 text-[15px] leading-8 text-text-secondary sm:text-base">
            取引環境やサービス内容はFX会社によって異なります。
            自分の資金、取引方法、利用するプラットフォームに合った会社を比較し、自分自身で選ぶことが大切です。
          </p>
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {HERO_POINTS.map((point) => (
              <div key={point} className="rounded-card border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary">
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-12">
        <div className="rounded-card border border-primary bg-[rgba(59,130,246,0.10)] p-6">
          <p className="text-sm font-bold text-text-primary">紹介リンクについて</p>
          <p className="mt-3 text-sm leading-8 text-text-secondary">
            このページには紹介リンクが含まれています。リンクを経由して口座開設等を行った場合、TUTTOが紹介報酬を受け取る場合があります。紹介報酬の有無にかかわらず、利用するFX会社やサービスは、ご自身で取引条件・リスク・規約等を確認したうえで判断してください。
          </p>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Checkpoints" title="選ぶときに確認したいこと" description="TUTTOは特定の会社を順位付けしません。比較する観点を分け、自分の取引計画に合うかを確認します。" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
          {CHECKPOINTS.map((item) => (
            <div key={item.title} className="card flex h-full flex-col gap-3 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-button border border-primary bg-[rgba(59,130,246,0.10)] text-primary">
                <item.icon size={18} strokeWidth={1.8} />
              </span>
              <h2 className="text-base font-bold text-text-primary">{item.title}</h2>
              <p className="text-sm leading-7 text-text-secondary">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-20">
        <SectionHeading eyebrow="Brokers" title="比較候補" description="掲載順は優劣を示すものではありません。各社の最新条件は必ず公式情報で確認してください。" />
        <div className="space-y-10">
          {BROKERS.map((broker) => {
            const tone = TONE_STYLES[broker.tone];

            return (
              <article key={broker.name} className={`card overflow-hidden ${tone.card}`}>
                <div className={`border-b p-7 sm:p-9 lg:p-10 ${tone.hero}`}>
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-5">
                      <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-card border ${tone.icon}`}>
                        <Building2 size={30} strokeWidth={1.8} />
                      </span>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-[0.18em] ${tone.text}`}>Broker</p>
                        <h2 className="mt-3 font-display text-3xl font-black leading-tight text-text-primary sm:text-5xl">{broker.name}</h2>
                      </div>
                    </div>
                    <div className={`h-1 w-24 rounded-full ${tone.divider}`} aria-hidden="true" />
                  </div>
                  <p className="mt-7 max-w-4xl text-base leading-8 text-text-secondary sm:text-lg">{broker.description}</p>
                </div>

                <div className="p-7 sm:p-9 lg:p-10">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
                    <section className={`rounded-card border p-6 sm:p-7 ${tone.panel}`} aria-labelledby={`${broker.name}-platform`}>
                      <p id={`${broker.name}-platform`} className={`text-xs font-black uppercase tracking-[0.18em] ${tone.text}`}>Trading Platform</p>
                      <p className="mt-5 font-display text-3xl font-black leading-tight text-text-primary sm:text-4xl">{broker.platform}</p>
                      <p className="mt-5 text-sm leading-7 text-text-secondary">利用したい取引環境に対応しているか、口座開設前に公式情報で確認してください。</p>
                    </section>

                    <section className="rounded-card border border-border bg-background/60 p-6 sm:p-7" aria-labelledby={`${broker.name}-characteristics`}>
                      <p id={`${broker.name}-characteristics`} className="text-sm font-bold text-text-primary">Main Characteristics</p>
                      <ul className="mt-5 grid grid-cols-1 gap-3">
                        {broker.characteristics.map((item) => (
                          <li key={item} className="flex gap-3 rounded-button border border-border bg-surface px-4 py-3 text-sm leading-7 text-text-secondary">
                            <CheckCircle2 className={`mt-1 shrink-0 ${tone.text}`} size={18} strokeWidth={1.8} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
                    <div>
                      <p className={`text-xs font-black uppercase tracking-[0.18em] ${tone.text}`}>Official Check</p>
                      <p className="mt-3 text-sm leading-7 text-text-secondary">条件・リスク・規約等は、口座開設前にリンク先の公式情報で確認してください。</p>
                      <p className="mt-4 text-xs leading-relaxed text-text-secondary">紹介リンクを含みます。条件・リスク・規約等はリンク先の公式情報で確認してください。</p>
                    </div>
                    <a href={broker.href} target="_blank" rel="noopener noreferrer sponsored" className={`inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-button border px-6 py-4 text-base font-black transition hover:-translate-y-0.5 ${tone.button}`} aria-label={`${broker.name}の紹介リンクを新しいタブで開く`}>
                      {broker.cta} <ArrowUpRight size={20} strokeWidth={1.8} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container-page mt-16">
        <div className="rounded-card border border-warning bg-[rgba(245,158,11,0.12)] p-6 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-button border border-warning text-warning">
              <ShieldAlert size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-primary">Risk Notice</h2>
              <p className="mt-3 text-sm leading-8 text-text-secondary">
                FX・CFD等の取引には損失リスクがあります。レバレッジを利用した取引では、価格変動によって損失が大きくなる可能性があります。TUTTOは利益を保証するものではありません。各サービスの最新条件・対象地域・規制・リスク説明・利用規約は各社の公式情報を確認してください。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}