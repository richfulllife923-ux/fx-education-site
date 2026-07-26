import { LucideIcon, ArrowRight, ArrowDown } from "lucide-react";

// アイコン付き原則カード（資金管理ページなどで使用）
export function PrincipleCard({
  icon: Icon,
  title,
  description,
  tone = "navy",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "navy" | "gold" | "sky";
}) {
  const toneMap = {
    navy: "bg-navy-50 text-navy-700",
    gold: "bg-gold-100 text-gold-700",
    sky: "bg-sky-100 text-sky-700",
  } as const;

  return (
    <div className="card flex flex-col gap-3 p-6">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneMap[tone]}`}>
        <Icon size={20} />
      </span>
      <h3 className="font-display text-base font-bold text-navy-900">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

// フローチャート（横並び／縦並び自動切替）
export function FlowChart({ steps }: { steps: { label: string; note?: string }[] }) {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-1 flex-col items-center gap-2 sm:flex-row">
          <div className="w-full rounded-xl border border-line bg-white p-4 text-center shadow-card">
            <p className="text-sm font-bold text-navy-900">{step.label}</p>
            {step.note && <p className="mt-1 text-xs text-muted">{step.note}</p>}
          </div>
          {i < steps.length - 1 && (
            <>
              <ArrowDown size={18} className="shrink-0 text-gold-500 sm:hidden" />
              <ArrowRight size={18} className="hidden shrink-0 text-gold-500 sm:block" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// 汎用比較テーブル
export function ComparisonTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-line">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="bg-navy-900 text-white">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-surface"}>
              {row.map((cell, j) => (
                <td key={j} className="border-t border-line px-4 py-3 text-navy-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 注意喚起・ポイント強調ボックス
export function Callout({
  tone = "gold",
  title,
  children,
}: {
  tone?: "gold" | "danger" | "sky";
  title: string;
  children: React.ReactNode;
}) {
  const toneMap = {
    gold: "border-gold-300 bg-gold-100/60",
    danger: "border-danger/30 bg-red-50",
    sky: "border-sky-300 bg-sky-100/60",
  } as const;

  return (
    <div className={`rounded-card border p-5 ${toneMap[tone]}`}>
      <p className="mb-1.5 text-sm font-bold text-navy-900">{title}</p>
      <div className="text-sm leading-relaxed text-navy-700">{children}</div>
    </div>
  );
}
