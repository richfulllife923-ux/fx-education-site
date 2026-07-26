/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages に静的サイトとしてそのままデプロイするための設定。
  // `next build` の出力が `out/` ディレクトリに生成される。
  output: "export",
  trailingSlash: true,
  images: {
    // 静的エクスポート時は Next.js の Image Optimization API が使えないため無効化。
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
