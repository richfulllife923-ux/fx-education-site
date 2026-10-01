import { verifyFeaturedCurrentness } from "./top3-freshness";
import issuers from "./edinet-issuers.json";
import index from "./edinet-filings.json";
import type { EdinetIndex } from "./edinet";
import { universeFilings } from "./top3-universe";
import { selectFeatured,selectionVersion,type FeaturedResult,type SelectionRun } from "../../lib/top3-selection";
import { parserVersion } from "./top3-versions";
export type ResearchRunStore={get(key:string,type:"json"):Promise<unknown>};
/** Server-only analysis artifacts. Public requests never start a Universe ZIP scan. */
export function pendingFeatured():FeaturedResult{
 const rows=universeFilings(issuers.issuers,index as EdinetIndex,index.coveredThrough??"1970-01-01");
 return {status:"ready",state:"IN_PROGRESS",entries:[],message:"Universeの分析とEvidence確認を準備しています。公開できる候補の選抜は未完了です。",
 manifest:{universeAsOf:issuers.asOf,filingCoverageThrough:index.coveredThrough,runStartedAt:"",runCompletedAt:null,ruleVersion:selectionVersion,parserVersion,
 snapshotId:"NOT_RUN",candidateEvidenceRefs:[],remainingUnknowns:["Cached identity/filing metadata only; not a current full analysis","Master company-specific evidence not reviewed","Guidance/revisions not verified"],
 coverage:{identityChecked:rows.length,filingChecked:rows.filter(r=>r.filingAvailable).length,parserVerified:0,discoveryEvidenceChecked:0,masterReviewed:0,publicEligible:0,processed:0}}};
}
export async function featuredFromStore(store?:ResearchRunStore,clock:()=>Date=()=>new Date(),key?:string):Promise<FeaturedResult>{
 if(!store)return pendingFeatured();
 const raw=await store.get("top3-research-run","json");if(!raw)return pendingFeatured();
 if(typeof raw!=="object"||Array.isArray(raw))throw new Error("Invalid research run");
 const run=raw as SelectionRun,m=run.manifest;
 if(!m||!Array.isArray(run.universe)||!Array.isArray(run.audits)||!Array.isArray(run.comparisons)||run.universe.length>10000||run.audits.length>10000||!m.coverage||!m.snapshotId||!m.runStartedAt||
 typeof run.complete!=="boolean"||typeof run.current!=="boolean"||!m.runCompletedAt&&run.complete)throw new Error("Invalid research run");
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(clock());
 // A date guard only invalidates prior-day proofs; it does not certify same-day currentness.
 // The private publisher must recheck listing and filing changes before setting current=true.
 const current=run.current&&m.universeAsOf===today&&m.filingCoverageThrough===today&&m.ruleVersion===selectionVersion&&m.parserVersion===parserVersion;
 const selected=selectFeatured({...run,current});
 if(selected.entries.length&&!(await verifyFeaturedCurrentness(m,key)))return selectFeatured({...run,current:false});
 return selected;
}
