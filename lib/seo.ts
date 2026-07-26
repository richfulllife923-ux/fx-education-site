import type { Metadata } from "next";

const SITE_NAME = "FX生存戦略ラボ";
const SITE_URL = "https://example.com"; // 本番URLに差し替え
const DEFAULT_DESCRIPTION =
  "『勝率ではなく、生存率を上げる』。FX初心者が安心して学べる教育サイト。資金管理、TUTTO理論、フィボナッチ構造分析、海外FXの基礎知識までを体系的に解説します。";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og/default.png`;

interface PageSeoInput {
  title: string;
  description?: string;
  path: string; // 例: "/fund-management"
  ogImage?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
}

/**
 * ページごとのMetadataを生成する共通関数。
 * すべてのpage.tsxはこの関数経由でtitle/description/OGP/canonicalを設定する。
 * これによりサイト全体でSEOルールのブレを防ぐ。
 */
export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  type = "website",
  publishedTime,
  modifiedTime,
  tags,
}: PageSeoInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = path === "/" ? `${title} | ${SITE_NAME}` : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: "ja_JP",
      type,
      ...(type === "article" && {
        publishedTime,
        modifiedTime,
        tags,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

export const site = {
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
};

/**
 * パンくずリストの構造化データ (BreadcrumbList) を生成
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * 記事(Article)の構造化データ
 */
export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image: string;
  publishedTime: string;
  modifiedTime: string;
  authorName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image: [input.image],
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime,
    author: [{ "@type": "Person", name: input.authorName }],
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: `${SITE_URL}${input.path}`,
  };
}

/**
 * FAQページ用の構造化データ
 */
export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
