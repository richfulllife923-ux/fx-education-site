import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { site } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | Market Structure Observation Framework`, template: `%s | ${site.name}` },
  description: site.description,
  robots: { index: true, follow: true },
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: `${site.name} | Market Structure Observation Framework`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    images: [{ url: site.ogImage, width: 1200, height: 630 }],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | Market Structure Observation Framework`,
    description: site.description,
    images: [site.ogImage],
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: site.logo,
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
        <Script
          id="cloudflare-web-analytics"
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "21019cce4a444a8cb7e2220cd3fc4209"}'
          strategy="afterInteractive"
        />
        <Header />
        <main>{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}