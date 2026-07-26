import type { MetadataRoute } from "next";
import { site } from "@/lib/seo";

// 静的エクスポート (output: "export") では、メタデータルートに
// force-static を明示する必要がある (Next.js 15+)。
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
