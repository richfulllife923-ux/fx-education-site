"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="ページ上部へ戻る"
      className="fixed bottom-6 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-button border border-border bg-surface text-text-primary shadow-card transition-transform hover:-translate-y-0.5 hover:border-primary"
    >
      <ArrowUp size={18} strokeWidth={1.8} />
    </button>
  );
}
