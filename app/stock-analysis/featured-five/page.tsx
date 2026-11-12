import type { Metadata } from "next";
import FeaturedFiveClient from "@/components/stock-analysis/FeaturedFiveClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "TUTTO 注目5銘柄",
    description:
      "企業の業績・財務・成長性・企業価値・リスクを観測する、TUTTOの公開株式ランキングです。",
    path: "/stock-analysis/featured-five/",
  }),
  robots: { index: false, follow: true },
};

export default function FeaturedFivePage() {
  return <FeaturedFiveClient />;
}
