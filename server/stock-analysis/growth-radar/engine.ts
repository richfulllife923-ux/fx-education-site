import {growth} from "../calculations";
import type {ChangeFact,EvidenceRef,GrowthRadarCompany,RadarInput,WhyNow} from "./model";
import {radarVersion} from "./model";
import {bindSource} from "./binding";
const date=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
function safeSource(s:EvidenceRef,i:RadarInput):boolean{
 try{
  const u=new URL(s.url),d=new Date(s.retrievedAt),at=new Date(i.evaluatedAt);
  return s.primaryVerified&&s.sourceType==="EDINET"&&u.protocol==="https:"&&u.hostname==="disclosure2.edinet-fsa.go.jp"&&
   u.pathname==="/WZEK0040.aspx"&&u.search==="?"+s.documentId&&!u.hash&&!u.username&&!u.password&&
   /^S[A-Z0-9]{7}$/.test(s.documentId)&&s.companyId===i.identity.companyId&&s.securityCode===i.identity.securityCode&&
   !!s.heading.trim()&&!!s.location.trim()&&date(s.period)&&date(s.filingDate)&&
   s.period<=s.filingDate&&s.filingDate<=i.evaluatedAt.slice(0,10)&&Number.isFinite(d.getTime())&&d<=at&&s.text.length<=16384;
 }catch{return false;}
}
export function evaluateRadar(input:RadarInput):GrowthRadarCompany{
 const unknowns=[...(input.conflicts??[])],sources:EvidenceRef[]=[];
 if(!input.identityVerified||!/^E\d{5}$/.test(input.identity.companyId)||! /^[1-9][0-9]{2}[A-Z0-9]$/.test(input.identity.securityCode))unknowns.push("IDENTITY_UNVERIFIED");
 if(!date(input.evaluationPeriod)||!input.latestDocumentIds.length||!Number.isFinite(Date.parse(input.evaluatedAt)))unknowns.push("CURRENT_PERIOD_UNVERIFIED");
 const seen=new Map<string,string>();
 for(const s of input.sources){
  const payload=JSON.stringify(s);
  if(seen.has(s.id)){if(seen.get(s.id)!==payload)unknowns.push("SOURCE_ID_CONFLICT");continue;}
  seen.set(s.id,payload);
  if(safeSource(s,input))sources.push(s);else unknowns.push("SOURCE_BINDING_UNVERIFIED");
 }
 const current=sources.filter(s=>input.latestDocumentIds.includes(s.documentId)&&s.period===input.evaluationPeriod);
 const bound=current.map(bindSource),facts=bound.flatMap(b=>b.facts),relations=bound.flatMap(b=>b.relations);
 for(const [n,c]of (input.comparisons??[]).entries()){
  const s=current.find(s=>s.id===c.sourceRef),prior=sources.find(s=>s.id===c.priorSourceRef);
  if(!s||!prior||c.current.source.accession!==s.documentId||c.prior.source.accession!==prior.documentId||
   c.current.source.provider!=="EDINET"||c.prior.source.provider!=="EDINET"||
   c.current.source.period!==s.period||c.prior.source.period!==prior.period||
   c.current.source.field!==s.location||c.prior.source.field!==prior.location||
   c.current.source.unit!=="currency"||c.prior.source.unit!=="currency")continue;
  const change=growth(c.current,c.prior);
  if(change.value===null||change.value===0)continue;
  const f:ChangeFact={id:s.id+"#numeric:"+c.metric+":"+n,companyId:s.companyId,securityCode:s.securityCode,layer:c.layer,metric:c.metric,
   direction:change.value>0?"INCREASE":"DECREASE",currentPeriod:s.period,priorPeriod:prior.period,
   sourceRef:s.id,priorSourceRef:prior.id,quote:"",span:null,currentValue:c.current.value,priorValue:c.prior.value,
   classification:"CANONICAL_CHANGE",confidence:"CONFIRMED"};
  if(!facts.some(v=>v.classification==="CANONICAL_CHANGE"&&v.metric===f.metric&&v.sourceRef===f.sourceRef&&v.priorSourceRef===f.priorSourceRef))facts.push(f);
 }
 const whyNow:WhyNow[]=unknowns.length?[]:relations.flatMap(r=>{
  const a=facts.find(f=>f.id===r.triggerFactId),b=facts.find(f=>f.id===r.effectFactId),s=current.find(s=>s.id===r.sourceRef);
  if(!a||!b||!s||a.layer===b.layer||a.currentPeriod!==b.currentPeriod||a.sourceRef!==b.sourceRef)return [];
  return [{triggerFactId:a.id,effectFactId:b.id,relationId:r.id,sourceRef:r.sourceRef,sourcePeriod:r.sourcePeriod,relationType:r.relationType}];
 });
 if(!whyNow.length)unknowns.push("EXPLICIT_CURRENT_RELATION_UNVERIFIED");
 unknowns.push("CONTINUITY_UNVERIFIED","MASTER_DEEP_RESEARCH_PENDING");
 return {identity:{...input.identity},state:whyNow.length?"CANDIDATE":facts.length>1?"VERIFYING":facts.length===1?"CHANGE_SIGNAL":"PAUSED",
  structuralChange:whyNow.length?"YES":"UNVERIFIED",continuity:"UNVERIFIED",facts,relations,whyNow,
  remainingUnknowns:[...new Set(unknowns)],lastEvaluatedAt:input.evaluatedAt,ruleVersion:radarVersion,
  evidenceCoverage:{sourcesReviewed:sources.length,changeFacts:facts.length,explicitRelations:relations.length,currentWhyNow:whyNow.length},
  nextReviewTriggers:["New formal filing","Official earnings / IR update","CF / risk / counter-thesis review"]};
}
/** No invented ranking: a frontier wider than the public cap remains withheld for formal comparison. */
export function publicCandidates(rows:GrowthRadarCompany[]){
 const unique=new Map<string,GrowthRadarCompany>();
 for(const r of rows){const key=r.identity.companyId+"|"+r.identity.securityCode;
  if(!unique.has(key)&&r.state==="CANDIDATE"&&r.structuralChange==="YES"&&r.whyNow.length)unique.set(key,r);}
 const eligible=[...unique.values()];
 return eligible.length>10?{state:"COMPARISON_REQUIRED",entries:[] as GrowthRadarCompany[]}:{state:"READY",entries:eligible};
}
