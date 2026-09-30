"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeStockInput } from "@/lib/stock-analysis";
export default function StockSearch({ initialValue = "" }: { initialValue?: string }) {
  const id = useId();
  const router = useRouter();
  const [error, setError] = useState("");
  return <section id="stock-input" className="card border-emerald-600/60 p-5 sm:p-8">
    <h2 className="text-2xl font-bold sm:text-3xl">銘柄を入力して分析</h2>
    <p className="mt-3 text-sm leading-7 text-text-secondary">会社名・証券コード・Tickerから企業情報と分析項目を確認できます。</p>
    <form className="mt-6" onSubmit={(event) => {
      event.preventDefault();
      const input = normalizeStockInput(String(new FormData(event.currentTarget).get("symbol") ?? ""));
      if (!input) { setError("銘柄名・証券コード・Tickerを入力してください。"); return; }
      if (input.length > 100) { setError("100文字以内で入力してください。"); return; }
      setError("");
      router.push("/stock-analysis/analyze/?"+new URLSearchParams({ symbol: input }).toString());
    }}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">銘柄名・証券コード・Ticker</label>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
        <input id={id} name="symbol" type="text" defaultValue={initialValue} maxLength={100} autoComplete="off"
          placeholder="銘柄名・証券コード・Tickerを入力" aria-describedby={id+"-help "+id+"-error"}
          aria-invalid={!!error} onChange={() => setError("")}
          className="stock-input min-w-0 flex-1" />
        <button type="submit" className="main-cta cta-stock">銘柄を分析する <span aria-hidden="true">→</span></button>
      </div>
      <p id={id+"-help"} className="mt-3 text-xs leading-6 text-text-secondary">例：トヨタ / 7203 / NVDA / キオクシア</p>
      <p id={id+"-error"} role="alert" className="mt-2 text-sm text-red-300">{error}</p>
    </form>
    <p className="mt-4 text-xs leading-6 text-text-secondary">企業データの取得・分析サービスは準備中です。現在は入力した銘柄の分析項目を確認できます。</p>
  </section>;
}
