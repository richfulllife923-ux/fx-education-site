// Helpers for grouping daily-analysis archive entries by week / month.
// All dates are JST calendar dates in "YYYY-MM-DD" form, so arithmetic is
// done on the calendar components (via UTC) without timezone conversion.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function toUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: string, days: number): string {
  const value = toUtcDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return formatDate(value);
}

/** Monday (JST week start) of the week containing the given date. */
export function mondayOfWeek(date: string): string {
  const value = toUtcDate(date);
  const offset = (value.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  value.setUTCDate(value.getUTCDate() - offset);
  return formatDate(value);
}

/** A week key is the Monday date "YYYY-MM-DD" of that week. */
export function isWeekKey(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = toUtcDate(value);
  if (formatDate(parsed) !== value) return false;
  return mondayOfWeek(value) === value;
}

export function weekRange(weekKey: string): { start: string; end: string } {
  return { start: weekKey, end: addDays(weekKey, 6) };
}

function monthDayLabel(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${month}月${day}日`;
}

/** e.g. "2026年11月第3週" */
export function weekName(weekKey: string): string {
  const [year, month, day] = weekKey.split("-").map(Number);
  const weekOfMonth = Math.ceil(day / 7);
  return `${year}年${month}月第${weekOfMonth}週`;
}

/** e.g. "2026年11月第3週（11月16日〜11月22日）" */
export function weekLabel(weekKey: string): string {
  const { start, end } = weekRange(weekKey);
  return `${weekName(weekKey)}（${monthDayLabel(start)}〜${monthDayLabel(end)}）`;
}

/** e.g. "11月16日〜11月22日" */
export function weekRangeLabel(weekKey: string): string {
  const { start, end } = weekRange(weekKey);
  return `${monthDayLabel(start)}〜${monthDayLabel(end)}`;
}

export function monthKeyOf(date: string): string {
  return date.slice(0, 7);
}

export function isMonthKey(value: string): boolean {
  if (!MONTH_PATTERN.test(value)) return false;
  const [, month] = value.split("-").map(Number);
  return month >= 1 && month <= 12;
}

export function monthRange(monthKey: string): { start: string; end: string } {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${monthKey}-01`,
    end: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** e.g. "2026年11月" */
export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${year}年${month}月`;
}
