import { buildMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { Music, Code2, LineChart, BookOpen } from "lucide-react";

export const metadata = buildMetadata({
  title: "運営者プロフィール",
  description: "FX生存戦略ラボの運営者プロフィール。FX歴、TUTTO理論開発の経緯、フィボナッチ研究、音楽制作・AI開発などの活動を紹介します。",
  path: "/profile",
});

const HIGHLIGHTS = [
  { icon: LineChart, title: "FXトレード歴", description: "実践と検証を重ねながら、資金管理を軸としたトレードスタイルを確立。" },
  { icon: BookOpen, title: "TUTTO理論の開発", description: "市場構造とフィボナッチを組み合わせた独自の分析フレームワークを考案・体系化。" },
  { icon: Code2, title: "AI・Web開発", description: "分析ツールやサイト構築にAI技術を活用し、学習コンテンツの制作を行う。" },
  { icon: Music, title: "音楽制作", description: "トレード分析で培った構造的な思考を、楽曲制作にも応用している。" },
];

export default function ProfilePage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "プロフィール", path: "/profile" }]} />

      <section className="container-page pt-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="h-24 w-24 shrink-0 rounded-full bg-gradient-to-br from-navy-700 to-navy-900" aria-hidden />
          <div>
            <p className="eyebrow">Founder</p>
            <h1 className="font-display text-2xl font-bold text-navy-900">A.I（運営者）</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              FX生存戦略ラボの運営者。「勝率ではなく生存率を上げる」という考え方のもと、
              資金管理とTUTTO理論を軸にした教育コンテンツを制作しています。
            </p>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Activities" title="主な活動" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="card flex items-start gap-4 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                <h.icon size={20} />
              </span>
              <div>
                <h3 className="font-display font-bold text-navy-900">{h.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{h.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
