"use client";
import { useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { comparisonAxes, normalizeStockInput, type SectionId } from "@/lib/stock-analysis";
import { useStockReport } from "./AnalysisClient";
import { StockLink } from "./StockUI";
const sectionForAxis: SectionId[] = ["business", "revenue", "growth", "performance", "cash-flow", "finance", "valuation", "risk", "earnings"];
export default function CompareClient() {
  const id = useId();
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const a = normalizeStockInput(params.get("a") ?? "");
  const b = normalizeStockInput(params.get("b") ?? "");
  const valid = !!a && !!b && a.length <= 100 && b.length <= 100 && a.toLocaleLowerCase() !== b.toLocaleLowerCase();
  const resultA = useStockReport(valid ? a : "");
  const resultB = useStockReport(valid ? b : "");
  return <>
    <form className="card p-5 sm:p-8" onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const first = normalizeStockInput(String(data.get("a") ?? ""));
      const second = normalizeStockInput(String(data.get("b") ?? ""));
      if (!first || !second || first.length > 100 || second.length > 100) { setError("比較する2銘柄をそれぞれ100文字以内で入力してください。"); return; }
      if (first.toLocaleLowerCase() === second.toLocaleLowerCase()) { setError("異なる2銘柄を入力してください。"); return; }
      setError("");
      router.push("/stock-analysis/compare/?"+new URLSearchParams({ a: first, b: second }).toString());
    }}>
      <div className="grid min-w-0 gap-5 sm:grid-cols-2" key={a+"|"+b}>
        {[["a", "銘柄A", a], ["b", "銘柄B", b]].map(([name, label, value]) => <div key={name} className="min-w-0">
          <label htmlFor={id+name} className="mb-2 block text-sm font-semibold">{label}</label>
          <input id={id+name} name={name} defaultValue={value.slice(0,100)} className="stock-input w-full min-w-0" maxLength={100}
            placeholder="会社名・証券コード・Ticker" aria-describedby={id+"-error"} aria-invalid={!!error} onChange={() => setError("")} />
        </div>)}
      </div>
      <button className="main-cta cta-stock mt-5" type="submit">銘柄を比較する <span aria-hidden="true">→</span></button>
      <p className="mt-3 text-xs leading-6 text-text-secondary">入力例：NVIDIA / キオクシア、トヨタ / BYD。研究対象の入力例であり、注目銘柄の指定ではありません。</p>
      <p id={id+"-error"} className="mt-2 text-sm text-red-300" role="alert">{error}</p>
    </form>
    <p className="mt-6 text-sm leading-7 text-text-secondary" role="status">
      {valid ? "比較対象："+a+" / "+b+"。企業データを照合するまで、同じ会社・市場かどうかは確定しません。" : "比較する2銘柄を入力してください。"}
    </p>
    {valid && <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {[[a, resultA], [b, resultB]].map(([symbol, result], index) => {
        const report = index === 0 ? resultA : resultB;
        const name = index === 0 ? a : b;
        return <div key={index} className="card min-w-0 p-5">
          <h2 className="break-words font-bold">{report?.status === "ready" ? report.report.companyName : name}</h2>
          <p className="mt-3 text-sm leading-7 text-text-secondary">{!report ? "接続状況を確認しています…" : report.status === "ready" ? "分析日："+report.report.analyzedAt : report.message}</p>
          <div className="mt-4"><StockLink href={"/stock-analysis/analyze/?"+new URLSearchParams({symbol: name})}>個別分析を見る</StockLink></div>
        </div>;
      })}
    </div>}
    <div className="mt-6 space-y-4">{comparisonAxes.map(([title, description], index) => <section className="card p-5 sm:p-6" key={title}>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-text-secondary">{description}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{[resultA, resultB].map((report, column) => <div key={column} className="min-w-0 rounded-card border border-border p-4 text-sm">
        <p className="break-words font-semibold">{column === 0 ? a || "銘柄A" : b || "銘柄B"}</p>
        {report?.status === "ready" && report.report.sections[sectionForAxis[index]]?.length ?
          report.report.sections[sectionForAxis[index]]!.map((item, i) => <p key={i} className="mt-2 break-words">{item.label}：{item.value} / {item.kind} / {item.asOf}</p>) :
          <p className="mt-2 text-text-secondary">未取得</p>}
      </div>)}</div>
    </section>)}</div>
  </>;
}
