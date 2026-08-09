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
    tone: "orange",
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
  orange: {
    card: "border-warning shadow-[0_0_34px_rgba(245,158,11,0.18)]",
    panel: "border-warning bg-[rgba(245,158,11,0.10)]",
    icon: "border-warning bg-[rgba(245,158,11,0.14)] text-warning",
    text: "text-warning",
    button: "border-warning bg-[rgba(245,158,11,0.20)] text-text-primary hover:bg-warning hover:text-background",
  },
  green: {
    card: "border-success shadow-[0_0_34px_rgba(34,197,94,0.16)]",
    panel: "border-success bg-[rgba(34,197,94,0.10)]",
    icon: "border-success bg-[rgba(34,197,94,0.14)] text-success",
    text: "text-success",
    button: "border-success bg-[rgba(34,197,94,0.14)] hover:bg-success hover:text-background",
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

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Brokers" title="比較候補" description="掲載順は順位を示すものではありません。各社の最新条件は必ず公式情報で確認してください。" />
        <div className="grid grid-cols-1 gap-7">
          {BROKERS.map((broker) => {
            const tone = TONE_STYLES[broker.tone];

            return (
              <article key={broker.name} className={`card overflow-hidden p-0 ${tone.card}`}>
                <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="flex min-h-full flex-col p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-card border ${tone.icon}`}>
                        <Building2 size={26} strokeWidth={1.8} />
                      </span>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${tone.text}`}>Broker</p>
                        <h2 className="mt-2 font-display text-3xl font-black leading-tight text-text-primary sm:text-4xl">{broker.name}</h2>
                      </div>
                    </div>

                    <p className="mt-6 text-base leading-8 text-text-secondary">{broker.description}</p>

                    <div className={`mt-8 rounded-card border p-5 ${tone.panel}`}>
                      <p className={`text-xs font-bold uppercase tracking-[0.16em] ${tone.text}`}>Trading Platform</p>
                      <p className="mt-3 font-display text-2xl font-black leading-tight text-text-primary sm:text-3xl">{broker.platform}</p>
                    </div>
                  </div>

                  <div className="border-t border-border bg-background/55 p-6 sm:p-8 lg:border-l lg:border-t-0">
                    <div className="rounded-card border border-border bg-surface p-5">
                      <p className="text-sm font-bold text-text-primary">Main Characteristics</p>
                      <ul className="mt-4 space-y-3.5">
                        {broker.characteristics.map((item) => (
                          <li key={item} className="flex gap-3 text-sm leading-7 text-text-secondary">
                            <CheckCircle2 className={`mt-1 shrink-0 ${tone.text}`} size={18} strokeWidth={1.8} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 rounded-card border border-border bg-surface p-5">
                      <p className={`text-xs font-bold uppercase tracking-[0.16em] ${tone.text}`}>Official Check</p>
                      <p className="mt-3 text-sm leading-7 text-text-secondary">条件・リスク・規約等は、口座開設前にリンク先の公式情報で確認してください。</p>
                    </div>

                    <div className="mt-7">
                      <a href={broker.href} target="_blank" rel="noopener noreferrer sponsored" className={`inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-button border px-6 py-4 text-base font-bold text-text-primary transition hover:-translate-y-0.5 ${tone.button}`} aria-label={`${broker.name}の紹介リンクを新しいタブで開く`}>
                        {broker.cta} <ArrowUpRight size={18} strokeWidth={1.8} />
                      </a>
                      <p className="mt-3 text-xs leading-relaxed text-text-secondary">紹介リンクを含みます。条件・リスク・規約等はリンク先の公式情報で確認してください。</p>
                    </div>
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