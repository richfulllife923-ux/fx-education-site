import type { ResearchEvidenceResult, EvidenceDecision } from "@/server/stock-analysis/research-evidence/model";
import { fiscalPeriodLabel } from "@/lib/stock-analysis-presentation";

const checks = [
  ["business", "事業構造"],
  ["majorRisk", "主要リスク"],
  ["cashFlowSustainability", "CF持続性"],
  ["counterThesis", "反対仮説"],
] as const;
const labels: Record<EvidenceDecision["status"], string> = {
  MET: "確認済み", PARTIAL: "主要確認・細部待ち", NOT_MET: "条件不成立", UNVERIFIED: "未確認",
};
function sourceUrl(value: string): string | undefined {
  try {
    const u = new URL(value);
    if (u.protocol === "https:" && u.hostname === "disclosure2.edinet-fsa.go.jp" &&
        u.pathname === "/WZEK0040.aspx" && /^\?S[A-Z0-9]{7}$/.test(u.search) && !u.username && !u.password) return u.href;
  } catch {}
}
export default function ResearchEvidenceCard({ value }: { value: ResearchEvidenceResult }) {
  return <section className="mt-5 min-w-0 rounded-card border border-border p-4" data-research-evidence>
    <h2 className="text-sm font-semibold">一次資料の確認状況</h2>
    <dl className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
      {checks.map(([key, title]) => <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1" key={key} data-evidence-check={key}>
        <dt className="text-sm text-text-secondary">{title}</dt>
        <dd className={"text-sm font-medium " + (value[key].status === "NOT_MET" ? "text-amber-300" : value[key].status === "UNVERIFIED" ? "text-text-secondary" : "text-emerald-300")}>{labels[value[key].status]}</dd>
      </div>)}
    </dl>
    <p className="mt-3 text-xs leading-6 text-text-secondary">{fiscalPeriodLabel(value.fiscalDate ?? undefined)} / EDINET。資料の取得と、研究条件の確認を分けて表示しています。</p>
    <details className="mt-3 min-w-0">
      <summary className="cursor-pointer text-sm text-blue-300">確認根拠を見る →</summary>
      <div className="mt-3 space-y-4 break-words text-xs leading-6">
        {checks.map(([key, title]) => {
          const check = value[key];
          const sources = [...new Set(check.evidenceRefs.map(id => value.provenance[id]?.url).filter((url): url is string => !!url))]
            .map(sourceUrl).filter((url): url is string => !!url);
          return <div key={key}>
            <h3 className="font-semibold">{title}：{labels[check.status]}</h3>
            <p>{check.reason}</p>
            {!!check.missingItems.length && <p>未確認項目：{check.missingItems.join(" / ")}</p>}
            {!!check.periodsReviewed?.length && <p>比較期間：{check.periodsReviewed.map(period => fiscalPeriodLabel(period)).join(" / ")}</p>}
            {sources.map(url => <a key={url} className="mr-3 text-blue-300 underline" href={url} target="_blank" rel="noopener noreferrer">EDINET提出書類を確認 →</a>)}
          </div>;
        })}
        <details><summary className="cursor-pointer">判定・出典データ</summary>
          <pre className="mt-2 max-w-full whitespace-pre-wrap break-all">{JSON.stringify(value, null, 2)}</pre>
        </details>
      </div>
    </details>
  </section>;
}
