import type { MetadataRoute } from "next";
import { site } from "@/lib/seo";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-static";

const STATIC_PATHS = [
  "",
  "/manifesto",
  "/framework",
  "/framework/philosophy",
  "/framework/structure-theory",
  "/framework/market-layer",
  "/framework/state",
  "/research",
  "/indicator",
  "/roadmap",
  "/brokers",
  "/fund-management",
  "/tutto-theory",
  "/fx-basics",
  "/overseas-fx",
  "/tools",
  "/blog",
  "/profile",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/blog" || path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
