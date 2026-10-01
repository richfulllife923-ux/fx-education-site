import type { CompanyData } from "./model";
import type { Evidence } from "../../lib/stock-analysis";
import type { UniverseIdentity,CandidateAudit,GrowthObservation } from "../../lib/top3-selection";
import { buildReport } from "./engine";
import { researchStatusForCompany } from "./research-status";
import { growth,freeCashFlow } from "./calculations";
/** Measurement only. The existing Master/Research Status owns condition truth. */
export function auditCompany(identity:UniverseIdentity,company:CompanyData,latestAnnual:string|null,latestDocuments:string[]):CandidateAudit{
 const report={...buildReport(company),researchStatus:researchStatusForCompany(company,"EMERGING")};
 const annual=[...company.annual].sort((a,b)=>b.end.localeCompare(a.end));
 const observations:GrowthObservation[]=[];
 for(const [family,key,label] of [["REVENUE","revenue","Revenue"],["PROFIT","operatingIncome","Operating Income"],["CASH_FLOW","operatingCF","Operating CF"]] as const){
  const data=annual.map(p=>p[key]),evidence=Object.values(report.sections).flat().filter((e):e is Evidence=>!!e&&e.label===label&&e.kind!=="UNKNOWN");
  const comparable=data.every((d,i)=>d.source.basis==="annual"&&d.source.period===annual[i].end&&d.source.currency===annual[0]?.currency&&d.source.unit==="currency")&&annual.slice(0,-1).every((p,i)=>{const days=(Date.parse(p.end)-Date.parse(annual[i+1].end))/86400000;return days>=330&&days<=400;});
  observations.push({family,periods:annual.map(p=>p.end),values:comparable?data.map(d=>d.value):data.map(()=>null),growthRates:data.slice(0,-1).map((d,i)=>growth(d,data[i+1]).value),evidence});
 }
 const fcf=annual.map(p=>freeCashFlow(p));
 observations.push({family:"CASH_FLOW",periods:annual.map(p=>p.end),values:fcf.map(c=>c.value),growthRates:[],
 evidence:(report.sections["cash-flow"]??[]).filter(e=>e.label==="Free Cash Flow"&&e.kind!=="UNKNOWN")});
 const latest=annual[0];
 const parserValid=company.provider==="EDINET"&&company.identity.edinetCode===identity.edinetCode&&company.identity.code===identity.code&&
 !!latest&&latest.end===latestAnnual&&!!latest.currency&&
 [latest.revenue,latest.operatingIncome,latest.operatingCF,latest.debt,latest.equity].some(d=>d.value!==null)&&
 [latest.revenue,latest.operatingIncome,latest.operatingCF,latest.debt,latest.equity].filter(d=>d.value!==null).every(d=>Number.isFinite(d.value)&&d.source.period===latest.end&&d.source.currency===latest.currency&&d.source.basis==="annual"&&d.source.unit==="currency");
 return {masterReview:null,identity,report,latestAnnual,latestDocuments,parserValid,observations,errors:[],remainingUnknowns:[
 ...report.researchStatus.pendingReasons,"市場認知Stage：UNKNOWN","最新Guidance・業績修正の本文Evidenceは未取得"]};
}
