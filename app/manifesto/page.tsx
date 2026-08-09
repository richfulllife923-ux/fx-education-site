import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Eye, Layers3, Route, ShieldCheck } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { FlowChart } from "@/components/Diagram";

const description = "TUTTOは市場予測ではなく、市場構造の観測、理解、学習を重視するFrameworkです。";

export const metadata: Metadata = {
  title: { absolute: "Manifesto | TUTTO" },
  description,
  alternates: { canonical: "/manifesto" },
  openGraph: {
    title: "Manifesto | TUTTO",
    description,
    url: "/manifesto",
    siteName: "TUTTO",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630 }],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Manifesto | TUTTO",
    description,
    images: ["/brand/og-image.png"],
  },
};

const PROMISES = [
  {
    number: "01",
    title: "市場に絶対はない",
    body: "どの理論にも、どのIndicatorにも、未来を保証する力はありません。不確実性を消すのではなく、不確実性が存在することを理解したうえで市場を見ることを大切にします。",
  },
  {
    number: "02",
    title: "予測ではなく、観測する",
    body: "未来を決めつけるのではなく、市場が実際に何を選択したのかを観測します。価格だけではなく、市場が形成した構造と、その受容・拒否を見ます。",
  },
  {
    number: "03",
    title: "小さな資金だからこそ、まず守る",
    body: "資金が限られているからこそ、大きく増やすことより先に、市場に残り続けることを学びます。低額資金は利益保証ではなく、学びを始める入口です。",
  },
  {
    number: "04",
    title: "数字ではなく、構造を理解する",
    body: "特定の数字やシグナルを暗記することを目的にしません。なぜその価格帯が重要なのか。市場がそこで何をしたのか。その意味を構造として理解します。",
  },
  {
    number: "05",
    title: "最後の判断は、自分自身で行う",
    body: "TUTTOは判断を代行するものではありません。FrameworkやIndicatorは、考えるための情報を整理する道具です。最終的な判断をブラックボックスへ預けないことを重視します。",
  },
];

const PRINCIPLES = [
  {
    icon: BookOpen,
    title: "学ぶための入口",
    text: "大きな資金や特別な才能を前提にせず、市場構造を学ぶための出発点を整えます。",
  },
  {
    icon: ShieldCheck,
    title: "守ることから始める",
    text: "短期間の成果を約束せず、市場に残り続けるための考え方を重視します。",
  },
  {
    icon: Layers3,
    title: "構造を見る",
    text: "価格の上下だけではなく、受容、拒否、保留、遷移を整理して観測します。",
  },
];

export default function ManifestoPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Manifesto", path: "/manifesto" }]} />

      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-0 h-px w-[720px] -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.14),transparent_60%)]" />
        </div>
        <div className="container-page relative py-16 pb-10 sm:pt-24 sm:pb-12">
          <div>
            <p className="eyebrow">
              <Eye size={14} strokeWidth={1.8} /> TUTTO Manifesto
            </p>
            <h1 className="max-w-4xl font-display text-4xl font-black leading-tight text-text-primary sm:text-6xl">
              市場に、絶対はない。
            </h1>
            <div className="prose-tutto mt-6 max-w-2xl text-[15px] sm:text-base">
              <p>未来を完全に予測することはできない。</p>
              <p>だからTUTTOは、「当てること」ではなく、市場が実際に何を選択したのかを観測する。</p>
              <p>市場を見る方法を学び、自分自身で判断できる状態を目指します。</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/framework" className="btn-primary">
                Frameworkを見る <ArrowRight size={16} strokeWidth={1.8} />
              </Link>
              <Link href="/research" className="btn-secondary">
                Researchへ進む
              </Link>
            </div>
          </div>
        </div>
        <div className="relative w-full overflow-hidden">
          <Image
            src="/images/manifesto/tutto-trading-observation.png"
            alt="複数の市場チャートを観測するトレーディング環境"
            width={2048}
            height={1084}
            priority
            sizes="100vw"
            className="h-[320px] w-full object-cover object-center sm:h-[460px] lg:h-[560px] xl:h-[620px]"
          />
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <SectionHeading
          eyebrow="Why TUTTO Exists"
          title="低額資金からでも、市場構造を学ぶことはできる"
          description="TUTTOは、少額で簡単に儲かることを伝えるためのものではありません。限られた資金から始める人が、市場との向き合い方を学び、判断材料を整理できるようになるためのFrameworkです。"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PRINCIPLES.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="card h-full p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-button border border-primary bg-[rgba(59,130,246,0.10)] text-primary">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <h2 className="mt-4 font-display text-base font-bold text-text-primary">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Prediction to Observation" title="予測から、観測へ" description="TUTTOは売買の答えを渡すのではなく、市場が形成した構造を読み取るための順序を大切にします。" />
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-sm font-bold text-text-primary">Traditional approach</p>
              <FlowChart
                steps={[
                  { label: "Signal" },
                  { label: "Prediction" },
                  { label: "Trade" },
                ]}
              />
            </div>
            <div>
              <p className="mb-4 text-sm font-bold text-text-primary">TUTTO approach</p>
              <FlowChart
                steps={[
                  { label: "Market" },
                  { label: "Structure" },
                  { label: "Observation" },
                  { label: "Acceptance / Rejection" },
                  { label: "Decision" },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <SectionHeading eyebrow="TUTTO Promise" title="自分で市場を観測し、考え、判断するために" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {PROMISES.map((promise, index) => (
            <article key={promise.number} className={`card p-6 sm:p-8 ${index === 4 ? "lg:col-span-2" : ""}`}>
              <p className="font-display text-sm font-black text-primary">{promise.number}</p>
              <h2 className="mt-3 font-display text-xl font-bold leading-snug text-text-primary">{promise.title}</h2>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-text-secondary">{promise.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16 sm:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeading eyebrow="Framework Philosophy" title="答えを売る場所ではなく、市場を見る方法を学ぶ場所" />
          <div className="prose-tutto max-w-2xl text-[15px]">
            <p>TUTTOは、判断を外へ預けるためのものではありません。</p>
            <p>FrameworkやIndicatorは、考えるための情報を整理し、観測の順序を見失わないための道具です。</p>
            <p>市場には絶対がない。だからこそ、構造を理解し、観測し、最後は自分自身で判断する。その姿勢を支えるために、TUTTOは存在します。</p>
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <div className="rounded-card border border-border bg-background p-6 sm:p-10">
          <p className="eyebrow">
            <Route size={14} strokeWidth={1.8} /> Closing Statement
          </p>
          <h2 className="max-w-3xl font-display text-2xl font-bold leading-snug text-text-primary sm:text-3xl">
            観測から、判断へ。
          </h2>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-text-secondary sm:text-base">
            市場を見る方法を学ぶことは、答えを受け取ることではありません。自分の目で構造を見て、受け入れられたものと拒否されたものを整理し、次の判断へ進むことです。
          </p>
        </div>
      </section>
    </div>
  );
}