export const DAILY_ANALYSIS_SCHEMA = "tutto-daily-analysis/1" as const;

export type DailyAnalysisDraft = {
  schema: typeof DAILY_ANALYSIS_SCHEMA;
  date: string;
  title: string;
  companyName: string;
  ticker: string;
  introduction: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    points: string[];
  }>;
  sources: Array<{ label: string; url: string }>;
};

export type PublishedDailyAnalysis = DailyAnalysisDraft & { publishedAt: string };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
  );
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;

  const now = new Date();
  const todayJst = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return value <= todayJst;
}

function safeSourceUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function parseDailyAnalysisDraft(value: unknown): DailyAnalysisDraft | null {
  if (!record(value) || value.schema !== DAILY_ANALYSIS_SCHEMA || !validDate(value.date)) return null;
  if (
    !text(value.title, 180) ||
    !text(value.companyName, 120) ||
    typeof value.ticker !== "string" ||
    !/^[A-Z0-9]{3,6}$/.test(value.ticker) ||
    !text(value.introduction, 1200) ||
    !Array.isArray(value.sections) ||
    value.sections.length < 1 ||
    value.sections.length > 10 ||
    !Array.isArray(value.sources) ||
    value.sources.length < 1 ||
    value.sources.length > 8
  ) {
    return null;
  }

  const sections: DailyAnalysisDraft["sections"] = [];
  for (const section of value.sections) {
    if (
      !record(section) ||
      !text(section.heading, 100) ||
      !Array.isArray(section.paragraphs) ||
      section.paragraphs.length > 8 ||
      !Array.isArray(section.points) ||
      section.points.length > 12 ||
      section.paragraphs.some((paragraph) => !text(paragraph, 2400)) ||
      section.points.some((point) => !text(point, 500))
    ) {
      return null;
    }
    sections.push({ heading: section.heading, paragraphs: section.paragraphs, points: section.points });
  }

  const sources: DailyAnalysisDraft["sources"] = [];
  for (const source of value.sources) {
    if (!record(source) || !text(source.label, 220) || !safeSourceUrl(source.url)) return null;
    sources.push({ label: source.label, url: source.url });
  }

  const contentLength = [
    value.title,
    value.companyName,
    value.introduction,
    ...sections.flatMap((section) => [section.heading, ...section.paragraphs, ...section.points]),
    ...sources.map((source) => source.label),
  ].reduce((length, item) => length + item.length, 0);
  if (contentLength > 14000) return null;

  return {
    schema: DAILY_ANALYSIS_SCHEMA,
    date: value.date,
    title: value.title,
    companyName: value.companyName,
    ticker: value.ticker,
    introduction: value.introduction,
    sections,
    sources,
  };
}

export function parsePublishedDailyAnalysis(value: unknown): PublishedDailyAnalysis | null {
  if (!record(value) || typeof value.publishedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value.publishedAt)) {
    return null;
  }
  if (!Number.isFinite(Date.parse(value.publishedAt))) return null;
  const draft = parseDailyAnalysisDraft(value);
  return draft ? { ...draft, publishedAt: value.publishedAt } : null;
}
