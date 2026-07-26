import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { site } from "@/lib/seo";

// フォントはビルド時にGoogle Fontsへネットワークアクセスしない、
// システムフォントスタック（globals.css内 --font-body / --font-display）を採用。
// これによりCI/CD環境のネットワーク制限に左右されず、常にビルドが成功する。

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}｜勝率ではなく、生存率を上げる`, template: `%s | ${site.name}` },
  description: site.description,
  robots: { index: true, follow: true },
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: `${site.url}/logo.png`,
  sameAs: ["https://twitter.com/", "https://youtube.com/"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${site.url}/blog?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <Header />
        <main>{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
