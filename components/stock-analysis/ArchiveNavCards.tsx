import Link from "next/link";
import styles from "./ArchiveNavCards.module.css";

const CARDS = [
  {
    href: "/daily-analysis/archive/weekly",
    title: "週刊市場分析",
    description: "毎日の市場分析を週ごとにまとめた一覧です。その週の記事をまとめて読み返せます。",
  },
  {
    href: "/daily-analysis/archive/monthly",
    title: "月間市場分析",
    description: "毎日の市場分析を月ごとにまとめた一覧です。その月の記事をまとめて読み返せます。",
  },
];

export default function ArchiveNavCards() {
  return (
    <div className={styles.navGrid}>
      {CARDS.map((card) => (
        <Link key={card.href} className={styles.navCard} href={card.href}>
          <span className={styles.navTitle}>{card.title}</span>
          <span className={styles.navDescription}>{card.description}</span>
          <span className={styles.navAction}>一覧を見る →</span>
        </Link>
      ))}
    </div>
  );
}
