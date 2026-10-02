import {selectionVersion,type CandidateAudit,type SelectionRun,type FeaturedCandidate} from "../../../lib/top3-selection";
import {summaryScoreForReport} from "../../../lib/summary-score-report";
import type {GrowthFeaturedCandidate,GrowthFeaturedResult} from "../../../lib/growth-radar-public";
import {pendingFeatured,type ResearchRunStore} from "../featured";
import {parserVersion} from "../top3-versions";
import {evidenceRuleVersion} from "../research-evidence/model";
import {evaluateRadar} from "./engine";
import {top3FromRadar} from "./adapter";
import type {RadarInput,GrowthRadarCompany} from "./model";
import type {Evidence} from '../../../lib/stock-analysis';

export const snapshotVersion="growth-radar-public/1";
export type GrowthSnapshot={version:typeof snapshotVersion;generatedAt:string;selectionRun:SelectionRun;inputs:RadarInput[]};
export type GrowthSnapshotStore=ResearchRunStore&{put(key:string,value:string):Promise<void>};
const keyOf=(id:{companyId:string;securityCode:string})=>id.companyId+"|"+id.securityCode;
const auditKey=(a:CandidateAudit)=>a.identity.edinetCode+"|"+a.identity.code;
const date=(v:unknown)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v));

/** Parse only the private saved envelope. No public request can create this object. */
function validate(raw:unknown,clock:()=>Date):GrowthSnapshot{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("Invalid growth snapshot");
 const s=raw as GrowthSnapshot,r=s.selectionRun,m=r?.manifest;
 if(s.version!==snapshotVersion||!Number.isFinite(Date.parse(s.generatedAt))||Date.parse(s.generatedAt)>clock().getTime()||
 !r||!m||!Array.isArray(r.universe)||!Array.isArray(r.audits)||!Array.isArray(r.comparisons)||!Array.isArray(s.inputs)||
 r.universe.length>10000||r.audits.length>10000||s.inputs.length>10000||r.comparisons.length>50000||
 typeof r.complete!=="boolean"||typeof r.current!=="boolean"||!m.coverage||!m.snapshotId||!m.runStartedAt||
 !Array.isArray(m.remainingUnknowns)||!date(m.universeAsOf)||!date(m.filingCoverageThrough)||
 (r.complete&&!m.runCompletedAt))throw Error("Invalid growth snapshot contract");
 const identities=new Set(r.universe.map(i=>i.edinetCode+"|"+i.code)),seen=new Set<string>();
 for(const i of s.inputs){
  const key=keyOf(i.identity);
  if(seen.has(key))throw Error("Duplicate Radar identity");seen.add(key);
  if(!Array.isArray(i.sources)||i.sources.length>1024||!Array.isArray(i.latestDocumentIds)||
   !Number.isFinite(Date.parse(i.evaluatedAt))||Date.parse(i.evaluatedAt)>Date.parse(s.generatedAt))throw Error("Invalid Radar input");
 }
 if(identities.size!==r.universe.length||new Set(r.universe.map(i=>i.code)).size!==r.universe.length||new Set(r.universe.map(i=>i.edinetCode)).size!==r.universe.length||
 new Set(r.audits.map(auditKey)).size!==r.audits.length||r.audits.some(a=>!identities.has(auditKey(a))))throw Error("Conflicting Universe identity");
 return s;
}

/** R11–R14 are consumers, not reinterpreted rules. Missing/unverified formal output never passes. */
function evidenceReviewed(a:CandidateAudit):boolean{
 const e=a.report?.researchEvidence;
 if(!e||e.ruleVersion!==evidenceRuleVersion||e.fiscalDate!==a.latestAnnual)return false;
 return ([['business','R11'],['cashFlowSustainability','R12'],['majorRisk','R13'],['counterThesis','R14']] as const).every(([key,rule])=>{
  const d=e[key];if(!d||!(d.status==="MET"||(key==="business"&&d.status==="PARTIAL"))||!d.evidenceRefs.length||
   !d.predicateTrace.some(t=>t.predicate.startsWith(rule+"/")&&t.outcome==="PASS"))return false;
  return d.evidenceRefs.every(ref=>{const p=e.provenance[ref];return p&&p.companyId===a.identity.edinetCode&&p.securityCode===a.identity.code&&
   p.ruleVersion===e.ruleVersion&&p.confidence==="CONFIRMED"&&
   p.url==='https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?'+p.documentId&&
   (a.latestDocuments.includes(p.documentId)||(key==='cashFlowSustainability'&&date(p.fiscalPeriod)&&p.fiscalPeriod<=a.latestAnnual!));});
 });
}
function empty():GrowthFeaturedResult{
 const r=pendingFeatured();
 return {...r,manifest:publicManifest(r.manifest),generatedAt:null,candidateCount:0,selectedCount:0,selected:[],entries:[],uiState:"VERIFYING"};
}
function publicManifest(m:SelectionRun['manifest']):GrowthFeaturedResult['manifest']{
 return {universeAsOf:m.universeAsOf,filingCoverageThrough:m.filingCoverageThrough,runStartedAt:m.runStartedAt,runCompletedAt:m.runCompletedAt,coverage:{...m.coverage}};
}
function publicEvidence(e:Evidence):Evidence{
 return {label:e.label,value:e.value,kind:e.kind,sourceUrl:e.sourceUrl,sourceTitle:e.sourceTitle,asOf:e.asOf,
  period:e.period,currency:e.currency,unit:e.unit,confidence:e.confidence};
}

/** Pure saved-result read. Does not fetch metadata, run discovery, or assign any formal review. */
export function projectSnapshot(raw:unknown,clock:()=>Date=()=>new Date()):GrowthFeaturedResult{
 const snapshot=validate(raw,clock),run=snapshot.selectionRun,m=run.manifest;
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(clock());
 const proof=m.freshnessProof;
 const current=run.current&&m.universeAsOf===today&&m.filingCoverageThrough===today&&m.ruleVersion===selectionVersion&&m.parserVersion===parserVersion&&
  proof?.day===today&&/^[a-f0-9]{64}$/.test(proof.identityArchiveSha)&&/^[a-f0-9]{64}$/.test(proof.dayListSha);
 const byIdentity=new Map(run.audits.map(a=>[auditKey(a),a]));
 const evaluated=snapshot.inputs.map(i=>{
  const a=byIdentity.get(keyOf(i.identity));
  const bound=!!a&&a.latestAnnual===i.evaluationPeriod&&i.latestDocumentIds.length===a.latestDocuments.length&&i.latestDocumentIds.every(d=>a.latestDocuments.includes(d));
  return evaluateRadar({...i,conflicts:[...(i.conflicts??[]),...(bound?[]:["RESEARCH_BINDING_CONFLICT"])]});
 });
 const candidates=evaluated.filter(c=>c.state==="CANDIDATE");
 const eligible=candidates.filter(c=>{const a=byIdentity.get(keyOf(c.identity));return !!a&&evidenceReviewed(a);});
 // Every audited issuer must also have a discovery result before publishing the Universe selection.
 const complete=run.complete&&run.audits.every(a=>snapshot.inputs.some(i=>keyOf(i.identity)===auditKey(a)));
 const result=top3FromRadar(eligible,{...run,current:!!current,complete});
 const selected:GrowthFeaturedCandidate[]=result.entries.map(entry=>{
  const audit=run.audits.find(a=>a.report?.symbol===entry.symbol)!;
  const radar=candidates.find(c=>keyOf(c.identity)===auditKey(audit))!;
  return publicCard(entry,audit,radar,snapshot.inputs.find(i=>keyOf(i.identity)===auditKey(audit))!);
 });
 return {...result,manifest:publicManifest(result.manifest),entries:selected,selected,selectedCount:selected.length,candidateCount:candidates.length,generatedAt:snapshot.generatedAt,
  uiState:selected.length?"READY":result.state==="COMPLETE"?"NO_QUALIFIED_CANDIDATES":"VERIFYING"};
}
function publicCard(entry:FeaturedCandidate,audit:CandidateAudit,radar:GrowthRadarCompany,input:RadarInput):GrowthFeaturedCandidate{
 const evidence=audit.report!.researchEvidence!;
 const status=entry.researchStatus,score=summaryScoreForReport(audit.report!);
 return {companyName:entry.companyName,symbol:entry.symbol,fiscalDate:entry.fiscalDate,
  researchStatus:{status:status.status,publicLabel:status.status==='GREEN'?'研究条件成立':status.publicLabel,shortReason:status.shortReason,sourceFiscalYear:status.sourceFiscalYear},
  whyNow:entry.whyNow.map(publicEvidence),keyNumbers:entry.keyNumbers.map(publicEvidence),
  whatIsChanging:[...new Set(radar.facts.filter(f=>radar.whyNow.some(w=>w.triggerFactId===f.id||w.effectFactId===f.id)).map(f=>f.quote).filter(Boolean))],
  radarWhyNow:radar.whyNow.map(w=>{
   const relation=radar.relations.find(r=>r.id===w.relationId)!,source=input.sources.find(s=>s.id===w.sourceRef)!;
   return {quote:relation.quote,sourceUrl:source.url,period:w.sourcePeriod,provenance:relation.provenance};
  }),summaryScore:{score:score.score,coverage:score.coverage,display:score.display},majorRisks:evidence.majorRisk.identifiedRisks??[],
  nextConfirmation:[...status.nextChecks,'次回の正式開示で成長変化とCash Flow・リスク・反対仮説を再確認'],updatedAt:radar.lastEvaluatedAt};
}
export async function saveGrowthSnapshot(store:Pick<GrowthSnapshotStore,"put">,snapshot:GrowthSnapshot,clock:()=>Date=()=>new Date()):Promise<GrowthFeaturedResult>{
 const result=projectSnapshot(snapshot,clock);
 // One atomic store value holds the run and its Radar bindings, preventing mixed generations.
 await store.put("top3-research-run",JSON.stringify(snapshot));return result;
}
export async function readGrowthFeatured(store?:ResearchRunStore,clock:()=>Date=()=>new Date()):Promise<GrowthFeaturedResult>{
 if(!store)return empty();
 const saved=await store.get("top3-research-run","json");
 if(saved===null||saved===undefined)return empty();
 // Old unconnected runs are not promoted into a Radar result. Refresh must produce the new envelope.
 if(typeof saved==="object"&&!("version" in saved)&&"manifest" in saved)return empty();
 return projectSnapshot(saved,clock);
}
