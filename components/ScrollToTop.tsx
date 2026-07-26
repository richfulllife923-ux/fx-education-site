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
      aria-label="ページトップへ戻る"
      className="fixed bottom-6 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-white shadow-card-hover transition-transform hover:-translate-y-0.5"
    >
      <ArrowUp size={18} />
    </button>
  );
}
