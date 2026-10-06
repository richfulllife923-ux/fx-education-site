import type { GrowthFeaturedResult } from "./growth-radar-public";
export async function loadFeatured(signal:AbortSignal):Promise<GrowthFeaturedResult>{
 const response=await fetch("/api/stock-analysis/featured",{signal,cache:"no-store"});
 if(!response.ok)throw new Error("Featured unavailable");
 const data=await response.json() as GrowthFeaturedResult;
 if((data.freshnessCheckedAt!==null&&!Number.isFinite(Date.parse(data.freshnessCheckedAt)))||data.status!=="ready"||!Array.isArray(data.entries)||data.entries.length>3||!data.manifest||
 !["COMPLETE","IN_PROGRESS","RECHECK_REQUIRED","COMPARISON_REQUIRED"].includes(data.state)||
 data.entries.some(e=>e.researchStatus?.status==="GRAY")||(data.state!=="COMPLETE"&&data.entries.length)||
 !["READY","VERIFYING","NO_QUALIFIED_CANDIDATES"].includes(data.uiState)||data.selectedCount!==data.entries.length||
 !Array.isArray(data.selected)||data.selected.length!==data.selectedCount||
 JSON.stringify(data.selected)!==JSON.stringify(data.entries)||
 (data.uiState==="READY")!==(data.selectedCount>0)||
 (data.uiState==="NO_QUALIFIED_CANDIDATES"&&data.state!=="COMPLETE")||
 data.entries.some(e=>!e.symbol||!e.companyName||!Array.isArray(e.radarWhyNow)||!Array.isArray(e.whatIsChanging)||
 !e.summaryScore||!Number.isFinite(e.summaryScore.coverage)||e.summaryScore.coverage<0||e.summaryScore.coverage>100||
 e.summaryScore.score!==null&&(!Number.isFinite(e.summaryScore.score)||e.summaryScore.score<0||e.summaryScore.score>100)||
 !['UNSCORED','PROVISIONAL','NORMAL'].includes(e.summaryScore.display)||
 !Array.isArray(e.majorRisks)||!Array.isArray(e.nextConfirmation)||!Number.isFinite(Date.parse(e.updatedAt))))throw new Error("Invalid featured snapshot");
 return data;
}
