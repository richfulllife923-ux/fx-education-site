import type {CompanyData,Datum,FinancialPeriod} from "./model";
import type {ResearchRunStore} from "./featured";
import {OBSERVATION_KEY,verifyObservationProjection} from "../../lib/public-observation";

export type ObservationMetrics={code:string;name:string;period:string;growth:number;margin:number;cashMargin:number};
const days=(a:string,b:string)=>(Date.parse(a)-Date.parse(b))/86400000;
/** Reuse finite, dated original annual facts only. Missing facts are never imputed. */
export function observationMetrics(company:CompanyData,asOf:string):ObservationMetrics|null {
  if(company.provider!=="EDINET" || company.identity.country!=="JP" || !company.identity.edinetCode || !/^\d{3}[\dA-Z]$/.test(company.identity.code))return null;
  const [current,previous]=[...company.annual].sort((a,b)=>b.end.localeCompare(a.end));
  if(!current || !previous || !Number.isFinite(Date.parse(asOf)) || days(asOf,current.end)<0 || days(asOf,current.end)>550 || days(current.end,previous.end)<350 || days(current.end,previous.end)>380)return null;
  const valid=(d:Datum,p:FinancialPeriod)=>p.basis==="annual" && p.currency==="JPY" && Number.isFinite(d.value) && d.value!==null &&
    d.source.provider==="EDINET" && d.source.classification==="FACT" && d.source.basis==="annual" && d.source.period===p.end && d.source.currency==="JPY" && d.source.unit==="currency" &&
    ["120","130"].includes(d.source.form??"") && /^S[0-9A-Z]+$/.test(d.source.accession??"") && /^https:\/\/disclosure2\.edinet-fsa\.go\.jp\//.test(d.source.url) &&
    (d.source as Datum["source"]&{financialScope?:string}).financialScope==="CONSOLIDATED" && d.source.start!=null && days(p.end,d.source.start)>=350 && days(p.end,d.source.start)<=380 &&
    Number.isFinite(Date.parse(d.source.retrievedAt)) && Date.parse(d.source.retrievedAt)<=Date.parse(asOf) && !!d.source.filingDate && Date.parse(d.source.filingDate)<=Date.parse(asOf);
  if(!valid(current.revenue,current)||!valid(previous.revenue,previous)||!valid(current.operatingIncome,current)||!valid(current.operatingCF,current))return null;
  if(current.revenue.value!<=0 || previous.revenue.value!<=0)return null;
  const metrics={code:company.identity.code,name:company.identity.name,period:current.end,growth:current.revenue.value!/previous.revenue.value!-1,margin:current.operatingIncome.value!/current.revenue.value!,cashMargin:current.operatingCF.value!/current.revenue.value!};
  return [metrics.growth,metrics.margin,metrics.cashMargin].every(Number.isFinite)?metrics:null;
}
/** Equal-weight geometric mean of midrank percentiles; zero is not imputed. */
export function rankObservations(rows:ObservationMetrics[]) {
  if(rows.length<3 || new Set(rows.map(r=>r.code)).size!==rows.length || rows.some(r=>![r.growth,r.margin,r.cashMargin].every(Number.isFinite)))throw Error("OBSERVATION_COHORT_INVALID");
  const dimensions=["growth","margin","cashMargin"] as const;
  const ranks=dimensions.map(key=>{
    const sorted=rows.map(r=>r[key]).sort((a,b)=>a-b),map=new Map<number,number>();
    for(let i=0;i<sorted.length;){let j=i+1;while(j<sorted.length&&sorted[j]===sorted[i])j++;map.set(sorted[i],100*(i+(j-i)/2)/rows.length);i=j;}return map;
  });
  return rows.map(row=>{
    const percentiles=dimensions.map((key,i)=>ranks[i].get(row[key])!);
    const rawScore=Math.exp(percentiles.reduce((n,v)=>n+Math.log(v),0)/dimensions.length);
    return {...row,percentiles,rawScore,score:Math.round(rawScore)};
  }).sort((a,b)=>b.rawScore-a.rawScore||a.code.localeCompare(b.code));
}
/** API reads a separate saved projection; it never runs Formal Research or scoring. */
export async function readPublicObservation(store?:ResearchRunStore){
  if(!store)throw Error("OBSERVATION_STORE_UNAVAILABLE");
  return verifyObservationProjection(await store.get(OBSERVATION_KEY,"json"));
}
