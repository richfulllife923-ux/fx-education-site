import { ArrowDown, ArrowRight, LucideIcon } from "lucide-react";

export function PrincipleCard({
  icon: Icon,
  title,
  description,
  tone = "primary",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "primary" | "success" | "warning";
}) {
  const toneMap = {
    primary: "border-primary bg-[rgba(59,130,246,0.10)] text-primary",
    success: "border-success bg-[rgba(34,197,94,0.10)] text-success",
    warning: "border-warning bg-[rgba(245,158,11,0.10)] text-warning",
  } as const;

  return (
    <div className="card flex h-full flex-col gap-3 p-6 hover:border-primary">
      <span className={`flex h-11 w-11 items-center justify-center rounded-button border ${toneMap[tone]}`}>
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <h3 className="font-display text-base font-bold text-text-primary">{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
    </div>
  );
}

export function FlowChart({ steps }: { steps: { label: string; note?: string }[] }) {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-1 flex-col items-center gap-2 sm:flex-row">
          <div className="w-full rounded-card border border-border bg-surface p-4 text-center shadow-card">
            <p className="text-sm font-bold text-text-primary">{step.label}</p>
            {step.note && <p className="mt-1 text-xs text-text-secondary">{step.note}</p>}
          </div>
          {i < steps.length - 1 && (
            <>
              <ArrowDown size={18} className="shrink-0 text-primary sm:hidden" strokeWidth={1.8} />
              <ArrowRight size={18} className="hidden shrink-0 text-primary sm:block" strokeWidth={1.8} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function ComparisonTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="bg-surface text-text-primary">
            {headers.map((h) => (
              <th key={h} className="border-b border-border px-4 py-3 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-surface"}>
              {row.map((cell, j) => (
                <td key={j} className="border-t border-border px-4 py-3 text-text-secondary">
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

export function Callout({
  tone = "primary",
  title,
  children,
}: {
  tone?: "primary" | "danger" | "warning";
  title: string;
  children: React.ReactNode;
}) {
  const toneMap = {
    primary: "border-primary bg-[rgba(59,130,246,0.10)]",
    danger: "border-danger bg-[rgba(239,68,68,0.10)]",
    warning: "border-warning bg-[rgba(245,158,11,0.10)]",
  } as const;

  return (
    <div className={`rounded-card border p-5 ${toneMap[tone]}`}>
      <p className="mb-1.5 text-sm font-bold text-text-primary">{title}</p>
      <div className="text-sm leading-relaxed text-text-secondary">{children}</div>
    </div>
  );
}

