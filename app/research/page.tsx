import { FileSearch, Microscope, NotebookText } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { PrincipleCard } from "@/components/Diagram";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Research",
  description: "TUTTO Frameworkの市場分析とケーススタディの入口ページです。",
  path: "/research",
});

const AREAS = [
  {
    icon: FileSearch,
    title: "Market Analysis",
    description: "公開可能な範囲で、市場構造がどう観測されたかを整理します。",
  },
  {
    icon: NotebookText,
    title: "Case Study",
    description: "実例を使い、構造受容、構造遷移、構造無効化の見方を学べる形式にします。",
  },
  {
    icon: Microscope,
    title: "Observation Notes",
    description: "検証前の断定ではなく、観測メモとして積み上げます。",
  },
];

export default function ResearchPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Research", path: "/research" }]} />
      <section className="container-page pt-6">
        <SectionHeading
          eyebrow="Research"
          title="市場分析・ケーススタディ"
          description="Researchは、TUTTO Frameworkを使って市場構造を読むための入口です。内部条件は公開せず、公開可能な観測結果と考え方だけを整理します。"
        />
      </section>
      <section className="container-page mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {AREAS.map((area) => (
          <PrincipleCard key={area.title} icon={area.icon} title={area.title} description={area.description} />
        ))}
      </section>
    </div>
  );
}