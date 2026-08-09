import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, Route, ScanLine, SquareStack } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { FlowChart, PrincipleCard } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "TUTTO Framework",
  description: "TUTTO Frameworkの基礎、Philosophy、Structure Theory、Market Layer、STATE、Trade Planを整理します。",
  path: "/framework",
});

const FOUNDATION = [
  {
    icon: BookOpen,
    title: "Philosophy",
    description: "市場を予測するのではなく、市場が採用した構造を観測するという中心思想です。",
    href: "/framework/philosophy",
  },
  {
    icon: ScanLine,
    title: "Structure Theory",
    description: "構造起点、構造認証点、構造候補を分け、構造受容と構造無効化を観測します。",
    href: "/framework/structure-theory",
  },
  {
    icon: Layers3,
    title: "Market Layer",
    description: "Execution、Swing、Structure、Macroの役割を分け、時間軸の混線を減らします。",
  },
  {
    icon: SquareStack,
    title: "STATE",
    description: "市場構造の形成、遷移、保留、無効化を人間が追える状態へ整理します。",
  },
  {
    icon: Route,
    title: "Trade Plan",
    description: "観測結果を、Entry、Stop、Targetの計画として表示するための境界です。",
  },
];

const TERMS = [
  "構造",
  "構造起点",
  "構造認証点",
  "構造候補",
  "構造受容",
  "構造認証",
  "構造拡張",
  "構造遷移",
  "構造無効化",
];

export default function FrameworkPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Framework", path: "/framework" }]} />
      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Foundation"
          title="TUTTO Framework"
          description="TUTTO Frameworkは、インジケーター単体ではなく、思想、構造理論、市場レイヤー、状態認識、Trade Planまでを含む市場構造観測の土台です。"
        />
        <FlowChart
          steps={[
            { label: "Philosophy", note: "予測ではなく観測" },
            { label: "Structure Theory", note: "構造の採用と拒否" },
            { label: "Market Layer", note: "役割分離" },
            { label: "STATE", note: "状態認識" },
            { label: "Trade Plan", note: "人間が使う計画" },
          ]}
        />
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Core" title="Framework Components" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
          {FOUNDATION.map((item) =>
            item.href ? (
              <Link key={item.title} href={item.href} className="group block h-full" aria-label={`${item.title} documentationを読む`}>
                <PrincipleCard icon={item.icon} title={item.title} description={item.description} />
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:text-text-primary">
                  詳しく読む <ArrowRight size={15} strokeWidth={1.8} />
                </span>
              </Link>
            ) : (
              <PrincipleCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
            )
          )}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Terminology" title="Official Terminology" description="公開サイトでは、一般的な比率名ではなくTUTTOの構造語彙へ統一します。" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TERMS.map((term) => (
            <div key={term} className="card px-4 py-3 text-sm font-semibold text-text-primary">
              {term}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}