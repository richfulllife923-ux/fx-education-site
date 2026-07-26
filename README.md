# FX生存戦略ラボ — サイト設計書

『勝率ではなく、生存率を上げる』をコンセプトにしたFX初心者向け教育サイト。
Next.js 14 (App Router) / React 18 / TypeScript / Tailwind CSS。

## 1. デザインコンセプト

Apple × TradingView × Notion を融合。

| 要素 | 方向性 |
|---|---|
| ベース | 白ベース＋余白多め（Apple / Notion） |
| データ表現 | ダークネイビーの塊で情報を区切る（TradingView） |
| カード | 角丸（`rounded-card` = 1.25rem）、影は薄く広く |
| フォント | 見出し: Zen Kaku Gothic New（display）／本文: Noto Sans JP（body） |

### カラートークン（`tailwind.config.ts`）
- `paper` #FFFFFF / `surface` #F7F8FA — ベース
- `navy.900` #0B1220 — ヘッダー影・フッター・見出し
- `gold.500` #C9A961 — CTA・強調（"生存"の証としてのゴールド）
- `sky.500` #5B9BD5 — タグ・補助アクセント（学習・冷静さ）

### アイコン選定
`lucide-react` に統一（線の太さが均一で「Apple/Notion的」な軽さがあるため）。
Wallet / ShieldCheck / LineChart / Gauge / Brain など、意味が一目で伝わるものを各セクションに割当て。

## 2. フォルダ構成

```
app/
  layout.tsx              # 共通レイアウト・フォント・JSON-LD(Organization/WebSite)
  page.tsx                 # トップページ
  globals.css
  sitemap.ts                # 動的サイトマップ
  robots.ts
  fund-management/page.tsx
  tutto-theory/page.tsx
  fx-basics/page.tsx
  fibonacci/page.tsx
  overseas-fx/page.tsx
  tools/page.tsx
  blog/
    page.tsx                # 一覧（検索・カテゴリ・ページネーション）
    [slug]/page.tsx          # 記事詳細（動的metadata・関連記事・JSON-LD）
  profile/page.tsx
  contact/
    page.tsx
    ContactForm.tsx          # "use client" フォーム本体のみ分離
components/
  Header.tsx / Footer.tsx
  Breadcrumb.tsx             # BreadcrumbList構造化データ込み
  PostCard.tsx
  Diagram.tsx                # PrincipleCard / FlowChart / ComparisonTable / Callout
  SectionHeading.tsx
  ScrollToTop.tsx
lib/
  posts.ts                   # 記事データ層（型 + サンプル配列 + 取得関数）
  seo.ts                      # buildMetadata() / JSON-LD生成ヘルパー
```

### 設計方針（サーバー/クライアント分離）
ページは基本すべて **Server Component**（`page.tsx`）にして高速表示とSEOを担保し、
インタラクションが必要な部分（ヘッダーのハンバーガーメニュー、お問い合わせフォーム、
スクロールトップボタン）だけを `"use client"` として最小単位に切り出しています。

## 3. 数百記事への拡張方法

`lib/posts.ts` の関数シグネチャ（`getAllPosts` / `getPostBySlug` / `getPostsByCategory` など）は
そのままに、内部実装だけを以下のいずれかに差し替えれば拡張できます。

1. **MDXファイル方式**: `content/posts/*.mdx` を `fs.readdirSync` + `gray-matter` で読み込む
2. **ヘッドレスCMS方式**: microCMS / Contentful などをfetchする非同期関数に変更
   （その場合 `page.tsx` 側を `async function` にするだけで済む設計）

`app/blog/[slug]/page.tsx` は `generateStaticParams` で全記事を静的生成しているため、
記事数が増えてもビルド時にすべて事前生成され、表示速度は落ちません。

## 4. SEO設計

- `lib/seo.ts` の `buildMetadata()` を全ページで共通利用 → title / description / canonical / OGP / Twitterカードの一貫性を担保
- 構造化データ: `Organization` / `WebSite`（layout） / `BreadcrumbList`（各ページ共通） / `Article`（記事詳細） / `FAQPage`（FX基礎知識ページ）
- `app/sitemap.ts` と `app/robots.ts` で動的サイトマップ・robots.txtを自動生成
- 内部リンク: フィボナッチページ→TUTTO理論ページなど、関連コンテンツを本文中で相互リンク
- パンくずリスト: 全下層ページに実装、構造化データも同時出力

## 5. アクセシビリティ・パフォーマンス

- `prefers-reduced-motion` 対応（`globals.css`）
- フォーカスリングはブラウザ標準を尊重（独自削除なし）
- 画像は `next/image` の AVIF/WebP自動変換設定済み（`next.config.mjs`）
- フォントは `next/font/google` でセルフホスト化・レイアウトシフト対策済み

## 6. セットアップ（ローカル開発）

```bash
npm install
npm run dev
```

`lib/seo.ts` 内の `SITE_URL` を本番ドメインに差し替えてください。
`app/contact/ContactForm.tsx` は現状フロントのみの送信確認UIです。実運用では
Cloudflare Pages Functions（`functions/api/contact.ts`）や外部フォームサービス（Formspree等）と
連携して送信処理を実装してください。

## 7. Cloudflare Pagesへのデプロイ

このプロジェクトは `next.config.mjs` で `output: "export"` を設定済みのため、
`next build` を実行するだけで `out/` ディレクトリに完全な静的サイトが生成されます。
Cloudflare Workers向けアダプタ（`@cloudflare/next-on-pages`）は不要です。

### 7-1. Cloudflareダッシュボードから接続する場合

1. GitHub等にこのリポジトリをpush
2. Cloudflare Pages → 「Create a project」→ 対象リポジトリを選択
3. ビルド設定を以下の通り入力
   - **Framework preset**: `Next.js (Static HTML Export)`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
4. 「Save and Deploy」で完了

### 7-2. Wrangler CLIで直接デプロイする場合

```bash
npm install
npm run build
npx wrangler pages deploy out --project-name=fx-survival-lab
```

### 7-3. 静的エクスポートに伴う制約と対応済みの回避策

`output: "export"` では以下の機能が使えないため、本プロジェクトでは最初から回避する設計にしています。

| 制約 | 本プロジェクトでの対応 |
|---|---|
| `searchParams` をサーバー側で読めない | `app/blog/page.tsx` はメタデータのみのServer Componentにし、検索・カテゴリ絞り込み・ページネーションは `components/BlogListClient.tsx`（`"use client"` + `useSearchParams`）でクライアント側に実装 |
| Next.js Image Optimization APIが使えない | `next.config.mjs` で `images.unoptimized: true` に設定。加えて `next/image` 自体を使用していないため影響なし |
| Route Handlers / Server Actions / Middleware | 未使用（お問い合わせフォームは現状クライアント完結のUIのみ） |
| 動的ルートには `generateStaticParams` が必須 | `app/blog/[slug]/page.tsx` に実装済み。新しい記事を `lib/posts.ts` に追加すれば自動的にビルド時生成される |

`app/sitemap.ts` と `app/robots.ts` はビルド時に静的な `sitemap.xml` / `robots.txt` として書き出されるため、
静的エクスポートでもそのまま動作します。
