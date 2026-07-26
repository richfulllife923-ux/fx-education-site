// ============================================================================
// 記事データ層
// 今はサンプル配列だが、将来的に数百記事に拡張する際は
// この関数群のシグネチャを変えずに、中身をMDX / microCMS / Notion API等の
// 実データ取得に差し替えるだけで済むように設計している。
// ============================================================================

export type Category =
  | "資金管理"
  | "TUTTO理論"
  | "FX基礎知識"
  | "フィボナッチ"
  | "海外FX"
  | "メンタル";

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  tags: string[];
  coverImage: string;
  publishedAt: string; // ISO date
  updatedAt: string;
  author: string;
  readingMinutes: number;
  content: string; // マークダウン想定（サンプルではプレーンテキスト）
}

export const CATEGORIES: Category[] = [
  "資金管理",
  "TUTTO理論",
  "FX基礎知識",
  "フィボナッチ",
  "海外FX",
  "メンタル",
];

export const posts: Post[] = [
  {
    slug: "why-survival-rate-matters-more-than-winrate",
    title: "なぜ「勝率」より「生存率」が大切なのか",
    excerpt:
      "勝率が高くても資金を溶かすトレーダーは後を絶ちません。生き残ることを軸に据えると、判断基準がどう変わるのかを整理します。",
    category: "資金管理",
    tags: ["資金管理", "メンタル", "初心者"],
    coverImage: "/images/blog/survival-rate.jpg",
    publishedAt: "2026-01-10",
    updatedAt: "2026-06-01",
    author: "A.I",
    readingMinutes: 6,
    content:
      "勝率だけを追いかけると、1回の大きな逆行で退場するリスクを見落としがちです。本記事では「生存率」という考え方を軸に、資金管理の優先順位をどう組み立てるかを解説します。",
  },
  {
    slug: "lot-size-basics-for-beginners",
    title: "初心者がまず理解すべきロットサイズの考え方",
    excerpt:
      "許容損失とストップ幅から逆算するロット計算の基本を、具体例つきで解説します。",
    category: "FX基礎知識",
    tags: ["ロット", "リスク管理", "初心者"],
    coverImage: "/images/blog/lot-size.jpg",
    publishedAt: "2026-02-02",
    updatedAt: "2026-02-02",
    author: "A.I",
    readingMinutes: 5,
    content:
      "ロットサイズは「許容損失 ÷ ストップ幅」で逆算するのが基本です。感覚でロットを決めることが、資金を溶かす最大の原因になります。",
  },
  {
    slug: "tutto-theory-state1-to-state5-overview",
    title: "TUTTO理論とは何か｜STATE1〜STATE5全体像",
    excerpt:
      "市場の受容・幾何学スコア・構造転換までを5段階で捉えるTUTTO理論の全体像を、初めての方向けに整理しました。",
    category: "TUTTO理論",
    tags: ["TUTTO理論", "市場構造"],
    coverImage: "/images/blog/tutto-overview.jpg",
    publishedAt: "2026-03-05",
    updatedAt: "2026-06-15",
    author: "A.I",
    readingMinutes: 9,
    content:
      "TUTTO理論は、市場が価格帯をどう受け入れ、どう構造転換していくかを5つのSTATEに分けて捉えるフレームワークです。",
  },
  {
    slug: "fibonacci-as-market-structure",
    title: "フィボナッチは「比率」ではなく「市場構造」として読む",
    excerpt:
      "0.618や0.786といった数値を暗記するのではなく、構造の中でどう機能するかを理解する視点を紹介します。",
    category: "フィボナッチ",
    tags: ["フィボナッチ", "市場構造"],
    coverImage: "/images/blog/fibonacci-structure.jpg",
    publishedAt: "2026-03-20",
    updatedAt: "2026-03-20",
    author: "A.I",
    readingMinutes: 7,
    content:
      "フィボナッチ比率は単なる数値ではなく、値動きが「どこで反応しやすいか」という市場参加者の集合的な意思決定の痕跡です。",
  },
  {
    slug: "offshore-fx-pros-and-cons",
    title: "海外FXのメリット・デメリットを公平に比較する",
    excerpt:
      "ゼロカットやハイレバレッジといった特徴を、リスクとセットで冷静に整理します。特定業者への過度な誘導は行いません。",
    category: "海外FX",
    tags: ["海外FX", "ゼロカット", "リスク管理"],
    coverImage: "/images/blog/offshore-fx.jpg",
    publishedAt: "2026-04-01",
    updatedAt: "2026-04-10",
    author: "A.I",
    readingMinutes: 8,
    content:
      "海外FXはゼロカットや高いレバレッジが魅力ですが、出金プロセスや規制体制は業者ごとに異なります。メリットとデメリットを両面から見ていきましょう。",
  },
  {
    slug: "why-you-should-withdraw-profit",
    title: "利益は「出金してこそ利益」という考え方",
    excerpt:
      "含み益を証拠金として使い続けることのリスクと、出金ルールをあらかじめ決めておく重要性について。",
    category: "資金管理",
    tags: ["資金管理", "出金", "メンタル"],
    coverImage: "/images/blog/withdraw-profit.jpg",
    publishedAt: "2026-04-18",
    updatedAt: "2026-04-18",
    author: "A.I",
    readingMinutes: 4,
    content:
      "口座内の含み益は、まだ「利益」ではなく「リスクにさらされた数字」です。あらかじめ出金ルールを決めておくことが、資金を守る鍵になります。",
  },
];

export function getAllPosts(): Post[] {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPostsByCategory(category: Category): Post[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getPopularPosts(limit = 5): Post[] {
  // 本番では閲覧数データに差し替え。現状は新着順で代用。
  return getAllPosts().slice(0, limit);
}

export function getRelatedPosts(current: Post, limit = 3): Post[] {
  return getAllPosts()
    .filter((p) => p.slug !== current.slug && p.category === current.category)
    .slice(0, limit);
}

export function getAllTags(): string[] {
  const set = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
  return Array.from(set);
}
