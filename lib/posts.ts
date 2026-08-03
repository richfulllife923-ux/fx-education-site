export type Category = "TUTTO" | "市場構造" | "資金管理" | "開発ログ" | "基礎知識";

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  tags: string[];
  coverImage: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  readingMinutes: number;
  content: string;
}

export const CATEGORIES: Category[] = ["TUTTO", "市場構造", "資金管理", "開発ログ", "基礎知識"];

export const posts: Post[] = [
  {
    slug: "why-survival-rate-matters-more-than-winrate",
    title: "勝率よりも生存率を重視する理由",
    excerpt: "一度の勝ち負けではなく、市場に残り続けるための設計思想を整理します。",
    category: "資金管理",
    tags: ["資金管理", "リスク", "生存率"],
    coverImage: "/images/blog/survival-rate.jpg",
    publishedAt: "2026-01-10",
    updatedAt: "2026-06-01",
    author: "TUTTO Lab",
    readingMinutes: 6,
    content:
      "TUTTOでは、短期的な勝率だけを目的にしません。市場観測を続けるためには、損失を管理し、判断が崩れる局面を避けることが重要です。資金管理は攻撃のためだけでなく、観測を継続するための基盤として扱います。",
  },
  {
    slug: "lot-size-basics-for-beginners",
    title: "ロットサイズを固定せず、状態に合わせて考える",
    excerpt: "ロット計算を、許容損失・市場状態・判断品質の関係から見直します。",
    category: "資金管理",
    tags: ["ロット", "リスク", "初心者"],
    coverImage: "/images/blog/lot-size.jpg",
    publishedAt: "2026-02-02",
    updatedAt: "2026-02-02",
    author: "TUTTO Lab",
    readingMinutes: 5,
    content:
      "ロットサイズは感覚で決めるものではありません。観測している構造が明確か、損切り位置が説明できるか、現在の市場が荒れていないかを確認し、過剰なリスクを避けることが基本です。",
  },
  {
    slug: "tutto-theory-state1-to-state5-overview",
    title: "TUTTOが市場構造を観測するということ",
    excerpt: "TUTTOを売買サインではなく、市場構造の観測フレームワークとして捉えるための導入です。",
    category: "TUTTO",
    tags: ["TUTTO", "市場構造", "観測"],
    coverImage: "/images/blog/tutto-overview.jpg",
    publishedAt: "2026-03-05",
    updatedAt: "2026-06-15",
    author: "TUTTO Lab",
    readingMinutes: 8,
    content:
      "TUTTOは未来価格を当てるための道具ではありません。市場が受け入れた構造と、拒否した構造を分けて観測し、トレーダーがチャート上で判断を組み立てるためのフレームワークです。内部判定式や独自パラメータは公開せず、一般公開サイトでは思想と利用目的を中心に説明します。",
  },
  {
    slug: "fibonacci-as-market-structure",
    title: "数値暗記ではなく、構造として価格帯を見る",
    excerpt: "比率そのものではなく、価格帯が市場参加者にどう扱われたかを見る視点を紹介します。",
    category: "市場構造",
    tags: ["価格帯", "構造", "観測"],
    coverImage: "/images/blog/structure-observation.jpg",
    publishedAt: "2026-03-20",
    updatedAt: "2026-03-20",
    author: "TUTTO Lab",
    readingMinutes: 7,
    content:
      "TUTTOでは、価格帯を単なる目標値として扱いません。到達、保持、拒否、通過といった市場の反応を観測し、現在の構造が継続しているのか、別の構造へ移行しているのかを整理します。",
  },
  {
    slug: "offshore-fx-pros-and-cons",
    title: "取引環境を選ぶ前に確認したいこと",
    excerpt: "取引条件だけでなく、透明性・リスク・運用ルールの観点から環境を確認します。",
    category: "基礎知識",
    tags: ["取引環境", "リスク", "基礎"],
    coverImage: "/images/blog/offshore-fx.jpg",
    publishedAt: "2026-04-01",
    updatedAt: "2026-04-10",
    author: "TUTTO Lab",
    readingMinutes: 8,
    content:
      "取引環境を選ぶときは、手数料やレバレッジだけではなく、入出金、約定、サポート、規約の透明性も確認する必要があります。観測と検証を続けるには、安定した実行環境が欠かせません。",
  },
  {
    slug: "why-you-should-withdraw-profit",
    title: "利益を守るルールを先に決める",
    excerpt: "利益を伸ばす前に、利益を口座外へ逃がす設計を持つ重要性を整理します。",
    category: "資金管理",
    tags: ["利益保護", "出金", "資金管理"],
    coverImage: "/images/blog/withdraw-profit.jpg",
    publishedAt: "2026-04-18",
    updatedAt: "2026-04-18",
    author: "TUTTO Lab",
    readingMinutes: 4,
    content:
      "利益は、口座内に残っている限り次のリスクにさらされます。TUTTOの資金思想では、勝つ局面を伸ばしながらも、守るラインを先に決めることを重視します。",
  },
];

export function getAllPosts(): Post[] {
  return [...posts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPostsByCategory(category: Category): Post[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getPopularPosts(limit = 5): Post[] {
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
