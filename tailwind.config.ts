import type { Config } from "tailwindcss";

// ==========================================================================
// デザイントークン (Design Tokens)
// コンセプト:「Apple × TradingView × Notion」
//  - Apple   : 余白・素材感・タイポグラフィの精度
//  - TradingView : ダークネイビー基調のデータ表現、チャート的な図解
//  - Notion  : 白ベースの読みやすさ、角丸カード、情報設計の明快さ
// ==========================================================================
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ベースカラー
        paper: "#FFFFFF",
        surface: "#F7F8FA",
        "surface-dark": "#0B1220",
        // アクセント: ダークネイビー（信頼・知性）
        navy: {
          50: "#EEF1F6",
          100: "#D6DCE8",
          300: "#8894AC",
          500: "#33415C",
          700: "#1B2439",
          900: "#0B1220",
        },
        // アクセント: ゴールド（達成・生存の証）
        gold: {
          100: "#F5E9D0",
          300: "#E3C285",
          500: "#C9A961",
          600: "#B08A3E",
          700: "#8C6C2E",
        },
        // アクセント: ライトブルー（学習・冷静さ）
        sky: {
          100: "#E7F1FC",
          300: "#A9CBF2",
          500: "#5B9BD5",
          700: "#3A6FA0",
        },
        // セマンティック
        ink: "#101828",
        muted: "#5B6472",
        line: "#E4E7EC",
        danger: "#C0392B",
        safe: "#2E7D5B",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "1.25rem",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,18,32,0.04), 0 8px 24px -12px rgba(11,18,32,0.12)",
        "card-hover": "0 4px 12px rgba(11,18,32,0.08), 0 16px 32px -12px rgba(11,18,32,0.16)",
      },
      maxWidth: {
        prose: "42rem",
        content: "72rem",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
