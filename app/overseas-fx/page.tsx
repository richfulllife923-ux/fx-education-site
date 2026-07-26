import { buildMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { ComparisonTable, Callout, PrincipleCard } from "@/components/Diagram";
import { ShieldCheck, Banknote, AlertTriangle, Scale } from "lucide-react";

export const metadata = buildMetadata({
  title: "海外FXとは｜メリット・デメリットを公平に解説",
  description:
    "海外FXの特徴、メリット・デメリット、ゼロカット、出金方法、資金管理の考え方を公平に解説。特定業者への偏った推奨は行いません。",
  path: "/overseas-fx",
});

export default function OverseasFxPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "海外FX", path: "/overseas-fx" }]} />

      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Fair Overview"
          title="海外FXとは"
          description="海外の金融ライセンスのもとで運営されるFX業者の総称です。国内FXとは規制環境が異なるため、特徴を正しく理解した上で利用を検討することが大切です。"
        />
        <Callout tone="sky" title="このページの方針">
          当サイトは特定の海外FX業者を過度に推奨することはありません。一般的な特徴を公平に整理し、
          判断材料を提供することを目的としています。業者選びの際は、必ずご自身で最新の公式情報を確認してください。
        </Callout>
      </section>

      <section className="container-page mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <PrincipleCard
          icon={ShieldCheck}
          tone="sky"
          title="メリット：ゼロカット"
          description="相場急変時に口座残高がマイナスになっても、業者側が補填し残高をゼロに戻す仕組み。追証が基本的に発生しません。"
        />
        <PrincipleCard
          icon={Banknote}
          tone="gold"
          title="メリット：少額から始めやすい"
          description="高いレバレッジを提供する業者が多く、少額資金でも一定の取引量を確保しやすいのが特徴です。"
        />
        <PrincipleCard
          icon={AlertTriangle}
          tone="navy"
          title="デメリット：規制体系の違い"
          description="国内の金融庁規制とは異なる法域のライセンスで運営されているため、業者ごとに信頼性や運営体制を見極める必要があります。"
        />
        <PrincipleCard
          icon={Scale}
          tone="navy"
          title="デメリット：ハイレバレッジのリスク"
          description="高いレバレッジは資金効率を高める一方、資金管理を誤ると損失も急拡大します。仕組みを理解した上での利用が前提です。"
        />
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Checklist" title="業者を検討する際に確認したい項目" />
        <ComparisonTable
          headers={["確認項目", "見るべきポイント"]}
          rows={[
            ["ライセンス情報", "どの国・機関の登録を受けているか、公式サイトで確認する"],
            ["出金実績・出金方法", "対応する出金手段と、出金にかかる目安の日数"],
            ["ゼロカットの適用条件", "全ての口座タイプに適用されるか、例外はないか"],
            ["取引コスト", "スプレッドや手数料など、実質的なコストの水準"],
            ["サポート体制", "日本語サポートの有無、問い合わせ対応の実績"],
          ]}
        />
      </section>

      <section className="container-page mt-16">
        <SectionHeading eyebrow="Money Management" title="海外FXを使う場合も、資金管理の原則は変わらない" />
        <p className="max-w-2xl text-sm leading-relaxed text-navy-700">
          ゼロカットや高いレバレッジは「大きな損失を防ぐ機能」ではなく、「損失の性質が変わる仕組み」に過ぎません。
          利用する業者の種類に関わらず、資金管理ページで紹介した7つの原則を守ることが、生存率を上げる基本になります。
        </p>
      </section>

      <section className="container-page mt-16">
        <Callout tone="danger" title="ご利用にあたって">
          海外FX業者の情報は変更される可能性があります。実際の口座開設・入出金の際は、必ず各社の公式サイトで最新情報をご確認の上、
          ご自身の判断と責任で行ってください。当サイトは特定業者との利用を推奨・保証するものではありません。
        </Callout>
      </section>
    </div>
  );
}
