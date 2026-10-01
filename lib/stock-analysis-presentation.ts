import type { Evidence, SectionId } from "./stock-analysis";

const labels:Record<string,string>={
  "VALUATION_STATUS = LIMITED":"現在価格との比較","Counter-Thesis（必須）":"この見方が崩れる条件",
  "Company Name":"会社名","Ticker / Code":"証券コード","Market":"市場","Sector":"セクター","Industry":"業種",
  "Revenue":"売上高","Operating Income":"営業利益","Net Income":"純利益",
  "Operating CF":"営業CF","Investing CF":"投資CF","Financing CF":"財務CF",
  "CapEx":"設備投資","CapEx（支出）":"設備投資","Free Cash Flow":"フリーCF",
  "Cash":"現金","Debt":"有利子負債","Equity":"純資産","Assets":"総資産","Total Assets":"総資産",
  "Liabilities":"総負債","Total Liabilities":"総負債",
  "Current Debt（全有利子負債の代用にはしない）":"短期借入金等","Noncurrent Debt（全有利子負債の代用にはしない）":"長期借入金等",
  "現金 − 有利子負債（投資資産は含めない）":"現金と有利子負債の差額",
  "Revenue YoY":"売上高成長率","Net Income YoY":"純利益成長率","Operating Income YoY":"営業利益成長率",
};
const titles:Partial<Record<SectionId,string>>={
  "cash-flow":"キャッシュフロー","growth":"成長性","valuation":"企業価値","risk":"リスク",
  "earnings":"次回決算の確認項目","notes":"資料と確認事項",
};
export const edinetViewingUrl="https://disclosure2.edinet-fsa.go.jp/";
export function publicLabel(label:string):string{return labels[label]??label;}
export function publicSectionTitle(id:SectionId,title:string):string{return titles[id]??title;}
export function periodEnd(period?:string):string|undefined{return period?.match(/\d{4}-\d{2}-\d{2}/g)?.at(-1);}
export function fiscalPeriodLabel(period?:string|null):string{
  const end=periodEnd(period??undefined);
  if(!end)return "対象期間未確認";
  const [year,month]=end.split("-");
  const basis=period?.includes("half-year")?"（半期）":period?.includes("quarterly")?"（四半期）":period?.includes("TTM")?"（直近12か月）":"";
  return year+"年"+Number(month)+"月期"+basis;
}
export function publicSource(item:Evidence):string{
  if(item.kind==="INFERENCE" || item.sourceTitle.startsWith("TUTTO") || item.sourceTitle==="参照データと確認条件")return "TUTTO";
  try{const host=new URL(item.sourceUrl).hostname;if(host==="edinet-fsa.go.jp"||host.endsWith(".edinet-fsa.go.jp"))return "EDINET";if(host==="sec.gov"||host.endsWith(".sec.gov"))return "SEC";}
  catch{}
  return item.sourceTitle.split(" / ")[0]||"出典未確認";
}
/** Display links never expose the EDINET binary/XBRL endpoints or ZIP downloads. */
export function publicSourceUrl(raw:string):string|null{
  try{const url=new URL(raw);if(!["http:","https:"].includes(url.protocol))return null;
    if(url.hostname==="edinet-fsa.go.jp"||url.hostname.endsWith(".edinet-fsa.go.jp"))return edinetViewingUrl;
    if(/\.zip(?:$|\/)/i.test(url.pathname))return null;
    return url.href;
  }catch{return null;}
}
export function documentId(item:Evidence):string|undefined{
  return [item.sourceTitle,item.sourceUrl,item.field??""].join(" ").match(/\bS[0-9A-Z]{7}\b/)?.[0];
}
const numeric=/^([+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(JPY|per share)?$/;
export function publicValue(item:Evidence):string{
  if(item.kind==="UNKNOWN" && (item.unit==="currency" || item.unit==="per share" || item.formula))return "未取得";
  if(/^(Bull|Base|Bear)：/.test(item.label))return item.value.replace(/^基準：\d{4}-\d{2}-\d{2} annual \/ [^。]+。/,"");
  const match=numeric.exec(item.value);if(!match)return item.value;
  const value=Number(match[1].replace(/,/g,""));if(!Number.isFinite(value))return item.value;
  if(item.unit==="per share" && item.currency==="JPY")return new Intl.NumberFormat("ja-JP",{maximumFractionDigits:2}).format(value)+"円／株";
  const yen=match[2]==="JPY" || (item.currency==="JPY" && item.unit==="currency");
  if(!yen)return item.value;
  const absolute=Math.abs(value),sign=value<0?"-":"";
  // Large figures omit sub-unit fractions; the exact original value stays in disclosure.
  if(absolute>=1e8){const oku=Math.trunc(absolute/1e8);
    if(oku>=10000){const cho=Math.trunc(oku/10000),rest=oku%10000;return sign+cho+"兆"+(rest?rest+"億":"")+"円";}
    return sign+oku+"億円";
  }
  if(absolute>=1e4)return sign+Math.trunc(absolute/1e4)+"万円";
  return new Intl.NumberFormat("ja-JP",{maximumFractionDigits:2}).format(value)+"円";
}
export function isFocusEvidence(item:Evidence,focusPeriod?:string|null):boolean{
  if(item.debtRole==="BREAKDOWN"||item.debtRole==="SUPPLEMENTAL")return false;
  const end=periodEnd(item.period);return !focusPeriod || !end || end===focusPeriod;
}
