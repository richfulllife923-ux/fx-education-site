import type { CompanyData, Datum, FinancialPeriod, Source } from "./model";
export const financialFields=["revenue","grossProfit","operatingIncome","netIncome","operatingCF","investingCF","financingCF","capex",
  "cash","investments","debt","equity","assets","receivables","inventory","shares","sbc","liabilities","eps"] as const;
export type FinancialField=(typeof financialFields)[number];
export function emptyPeriod(end:string,basis:FinancialPeriod["basis"],currency:string|null,source:Source):FinancialPeriod {
  const values=Object.fromEntries(financialFields.map(field=>[field,{value:null,source:{...source,field:"unavailable."+field,unit:field==="shares"?"shares":field==="eps"?"per share":"currency"}}])) as Record<FinancialField,Datum>;
  return {end,basis,currency,...values};
}
export function emptyValuation(source:Source):CompanyData["valuation"] {
  return Object.fromEntries(["pe","pb","evEbitda","ps","epsTTM","marketCap","enterpriseValue","ebitdaTTM"].map(field=>[
    field,{value:null,source:{...source,basis:field==="epsTTM"?"TTM":"instant",period:null,field:"unconnected.market-price."+field}}
  ])) as CompanyData["valuation"];
}
