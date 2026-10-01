import type { CompanyData, Datum, FinancialPeriod } from "./model";
import { dateOrNull } from "./model";
import { freeCashFlow } from "./calculations";
import { evaluateResearchStatus, unavailableResearchStatus, type Availability, type ResearchStatusInput } from "../../lib/research-status";
function unverifiedConditions(reason:string):ResearchStatusInput["conditions"] {
 const item=()=>({state:"UNVERIFIED" as const,reason,evidenceRefs:[] as string[]});
 return {business:item(),financials:item(),cashFlow:item(),balanceSheet:item(),risk:item(),counterThesis:item(),valuation:item(),growth:item()};
}
function availability(datum:Datum|undefined,period:FinancialPeriod|undefined):Availability {
 if(!datum || datum.value===null)return "MISSING";
 if(!Number.isFinite(datum.value) || !period || datum.source.period!==period.end ||
    datum.source.basis!=="annual" || !datum.source.currency || datum.source.currency!==period.currency ||
    !datum.source.field || !datum.source.url || datum.source.unit!=="currency")return "UNVERIFIED";
 return "AVAILABLE";
}
/** Observe only canonical facts. Existing narrative templates do not attest condition truth or risk clearance. */
export function researchInput(company:CompanyData,growthMode:"STANDARD"|"EMERGING"="STANDARD"):ResearchStatusInput {
 const latest=company.annual[0],fcf=latest?freeCashFlow(latest):undefined;
 const observed=[latest?.revenue,latest?.operatingIncome,latest?.operatingCF,latest?.debt,latest?.equity].filter((d):d is Datum=>!!d&&d.value!==null);
 const conditions=unverifiedConditions("正式な個別合否条件または本文Evidenceの確認が未完了です。");
 if(company.annual.length<3)conditions.financials={state:"NOT_MET",reason:"Master 10の最低3年の年次データ確認が未完了です。",evidenceRefs:["Master/10"]};
 // A provider value or positive FCF is availability, never proof of Business/CF/Risk/Valuation quality.
 const primary=company.primarySource?.classification==="FACT";
 return {
  provider:"READY",identity:!company.identity.name||!company.identity.symbol?"UNRESOLVED":primary?"VERIFIED":"UNVERIFIED",
  latestAnnual:latest?.basis==="annual"&&dateOrNull(latest.end)?"AVAILABLE":"MISSING",
  primaryEvidence:!company.filings?.some(f=>f.period===latest?.end)?"MISSING":primary?"AVAILABLE":"UNVERIFIED",
  dataIntegrity:latest?.currency && observed.length>0 && observed.every(d=>availability(d,latest)==="AVAILABLE")?"VALID":"UNVERIFIED",
  debt:availability(latest?.debt,latest),operatingCF:availability(latest?.operatingCF,latest),
  freeCF:availability(fcf?{value:fcf.value,source:fcf.source}:undefined,latest),
  cashFlowMissingSeverity:"UNVERIFIED",majorRisk:"UNVERIFIED",counterThesisMajorRisk:"UNVERIFIED",
  valuation:company.valuationStatus==="LIMITED"||!company.quote?"MISSING":"UNVERIFIED",
  growthMode,conditions,sourceFiscalYear:latest?.end??null,
  ownerDecisionsRequired:[
   "Business：必要Evidenceと理解成立の合否条件",
   "Financials／Balance Sheet：良好性と重大財務欠損の合否条件",
   "Cash Flow：持続性の合否条件と欠損の重大性",
   "Risk／Counter-Thesis：重大性と解決済みの確認条件",
   "Valuation：評価モデル・安全域・条件成立の基準",
   "Data freshness：項目別の許容鮮度と再確認方法",
   ...(growthMode==="EMERGING"?["Emerging Growth：成長変化と持続性の合否条件"]:[]),
  ],
 };
}
export function researchStatusForCompany(company:CompanyData,growthMode:"STANDARD"|"EMERGING"="STANDARD"){
 return evaluateResearchStatus(researchInput(company,growthMode));
}
export function researchStatusForFailure(){ return unavailableResearchStatus(); }