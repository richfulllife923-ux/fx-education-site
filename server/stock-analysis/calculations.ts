import type { Datum, FinancialPeriod, Source } from "./model";
export type Calculation = { value: number | null; formula: string; inputs: { name: string; datum: Datum }[]; reason: string | null; source: Source };
function calculate(formula: string, inputs: {name:string;datum:Datum}[], compute: (values:number[])=>number|null, unit: string): Calculation {
  const sources = inputs.map(input => input.datum.source);
  const first = sources[0];
  const missing = inputs.some(input => input.datum.value === null);
  const incompatible = sources.some(source => source.period !== first.period || source.basis !== first.basis || source.currency !== first.currency || source.currency === null);
  const reason = missing ? "入力データが未取得" : incompatible ? "通貨・期間・集計基準が不一致" : null;
  const result = reason ? null : compute(inputs.map(input => input.datum.value!));
  return {value: result !== null && Number.isFinite(result) ? result : null,formula,inputs,
    reason: reason ?? (result === null ? "分母または比較条件が不適切" : null),
    source: {...first, field:formula, unit}};
}
export function margin(profit:Datum,revenue:Datum): Calculation {
  return calculate("profit / revenue × 100",[{name:"profit",datum:profit},{name:"revenue",datum:revenue}],([p,r])=> r > 0 ? p/r*100 : null,"%");
}
export function freeCashFlow(period:FinancialPeriod): Calculation {
  return calculate("operatingCF − CapEx (支出を正数に正規化)",[{name:"operatingCF",datum:period.operatingCF},{name:"CapEx",datum:period.capex}],([cf,capex])=>capex>=0?cf-capex:null,"currency");
}
export function netCash(period:FinancialPeriod): Calculation {
  return calculate("cash − interest-bearing debt",[{name:"cash",datum:period.cash},{name:"debt",datum:period.debt}],([cash,debt])=>cash-debt,"currency");
}
export function growth(current:Datum,previous:Datum): Calculation {
  const source = {...current.source,unit:"%"};
  const same = current.source.currency !== null && current.source.currency === previous.source.currency &&
    current.source.basis === previous.source.basis;
  const days = current.source.period && previous.source.period ?
    (Date.parse(current.source.period)-Date.parse(previous.source.period))/86400000 : 0;
  const valid = same && current.source.basis === "annual" && days >= 330 && days <= 400 &&
    current.value !== null && previous.value !== null && previous.value > 0;
  return {value:valid?(current.value!/previous.value!-1)*100:null,source,
    formula:"(current / previous − 1) × 100",inputs:[{name:"current",datum:current},{name:"previous",datum:previous}],
    reason:valid?null:"同一通貨の連続する年次データと正の前年値が必要（赤字転換は別途確認）"};
}
export function ratio(numerator:Datum,denominator:Datum,formula:string,unit="倍"): Calculation {
  return calculate(formula,[{name:"numerator",datum:numerator},{name:"denominator",datum:denominator}],([n,d])=>d>0?n/d:null,unit);
}
/** No foreign-exchange guessing, current price × historical shares, or annual/TTM mixing. */
export function fcfYield(fcf:Datum,marketCap:Datum): Calculation {
  return calculate("FCF / market cap × 100",[{name:"FCF",datum:fcf},{name:"marketCap",datum:marketCap}],([f,m])=>m>0?f/m*100:null,"%");
}
