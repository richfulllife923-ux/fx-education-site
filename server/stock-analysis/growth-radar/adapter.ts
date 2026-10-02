import {selectFeatured,type SelectionRun} from "../../../lib/top3-selection";
import type {GrowthRadarCompany} from "./model";
/** A request for existing Master evaluation, not an assertion that any Master gate passed. */
export function deepResearchRequest(company:GrowthRadarCompany){
 if(company.state!=="CANDIDATE"||company.structuralChange!=="YES"||!company.whyNow.length)return null;
 return {state:"DEEP_RESEARCH" as const,identity:{...company.identity},whyNow:company.whyNow.map(w=>({...w})),
  requiredReviews:["Business","Profitability","CF","Growth","Financial Health","Risk","Valuation","Counter-Thesis","Evidence Coverage","Summary Score"],
  formalStatus:"PENDING" as const};
}
/** Radar can restrict the reviewed pool, never construct reviews, change law, or mark a bounded run complete. */
export function top3FromRadar(candidates:GrowthRadarCompany[],run:SelectionRun){
 const allowed=new Set(candidates.filter(c=>deepResearchRequest(c)).map(c=>c.identity.companyId+"|"+c.identity.securityCode));
 // Keep the entire audited Universe: an evaluated noncandidate is not an unprocessed company.
 // Mask only public eligibility. Never turn an incomplete Universe into a completed run.
 const audits=run.audits.map(a=>allowed.has(a.identity.edinetCode+"|"+a.identity.code)?a:{...a,report:null});
 return selectFeatured({...run,audits});
}
