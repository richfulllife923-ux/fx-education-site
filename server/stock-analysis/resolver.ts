import { StockError, type Candidate, type StockProvider } from "./model";
export const aliases: Record<string,string> = {
  "トヨタ": "7203", "トヨタ自動車": "7203", "TOYOTA": "7203", "TOYOTA MOTOR": "7203",
  "TOYOTA MOTOR CORPORATION": "7203", "トヨタ自動車株式会社":"7203", "キオクシア": "285A", "キオクシアホールディングス":"285A", "KIOXIA": "285A",
  "NVIDIA": "NVDA", "APPLE": "AAPL", "MICROSOFT": "MSFT",
};
export function normalizeInput(value: string): string {
  const normalized = value.normalize("NFKC").trim().replace(/\s+/g," ").toUpperCase();
  if (!normalized || normalized.length > 100 || /[\u0000-\u001f\u007f]/.test(normalized))
    throw new StockError("INVALID_INPUT","銘柄を1〜100文字で入力してください。");
  return normalized;
}
export async function resolveSymbol(input: string, provider: StockProvider): Promise<Candidate> {
  const normalized = normalizeInput(input);
  const query = aliases[normalized] ?? normalized;
  const match = /^([A-Z0-9_-]{1,20})\.(T|TSE|JP|US)$/.exec(query);
  const code = match?.[1] ?? query;
  const exchange = match ? match[2] === "US" ? "US" : match[2]==="JP" ? "JP" : "TSE" : null;
  const aliasMarket=aliases[normalized] && ["7203","285A"].includes(code)?"JP":undefined;
  const found = await provider.search(code,exchange??aliasMarket);
  const unique = [...new Map(found.filter(candidate =>
    !exchange || candidate.exchange === exchange || (exchange==="TSE" && candidate.exchange==="JP")
  ).map(candidate => [candidate.symbol,candidate])).values()];
  // Exact code and alias matching; never use provider popularity ranking to choose.
  const exact = unique.filter(candidate => candidate.code.toUpperCase() === code);
  const candidates = exact.length ? exact : match || aliases[normalized] || /^[0-9]{3}[A-Z0-9]$/.test(code) ? [] : unique;
  if (!candidates.length) throw new StockError("SYMBOL_NOT_FOUND","対応する日本・米国の普通株を確認できませんでした。会社名または市場付きコードを確認してください。");
  const aliasBrand:Record<string,RegExp>={"7203":/toyota|トヨタ/i,"285A":/kioxia|キオクシア/i,
    "NVDA":/nvidia/i,"AAPL":/apple/i,"MSFT":/microsoft/i};
  const verified=aliases[normalized] && aliasBrand[code] ?
    candidates.filter(candidate=>aliasBrand[code].test(candidate.name)):candidates;
  if(!verified.length)throw new StockError("SYMBOL_NOT_FOUND","企業名とコードの対応を確認できませんでした。市場付きコードまたは正式会社名で検索してください。");
  if (verified.length > 1) throw new StockError("AMBIGUOUS_SYMBOL","複数の企業・市場が見つかりました。企業と市場を選択してください。",verified.slice(0,12));
  return verified[0];
}
