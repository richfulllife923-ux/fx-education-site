import type {GrowthFeaturedCandidate,GrowthFeaturedResult} from '../../../lib/growth-radar-public';
import type {SelectionRun} from '../../../lib/top3-selection';
import {selectionVersion} from '../../../lib/top3-selection';
import {parserVersion} from '../top3-versions';
import type {GrowthSnapshot} from './pipeline';

/** RUN_STORAGE_READ_MINIMAL_FIX. Frozen result transport; no evaluator or selection call. */
export const publicationProjectionVersion='top3-publication-projection/1';
type JevStatus='PASS'|'HOLD'|'UNVERIFIED';
export type PublicationContext={result:GrowthFeaturedResult;sourceGeneration:string;
 jev:{pre:JevStatus;post:JevStatus};fullRunFileSha256?:string};
type DisplayRow={rank:number;companyName:string;symbol:string;fiscalDate:string;
 observationScore:GrowthFeaturedCandidate['summaryScore'];shortReason:string;
 researchStatus:GrowthFeaturedCandidate['researchStatus']};
export type PublicationProjection={version:typeof publicationProjectionVersion;run_id:string;generated_at:string;
 source_generation:string;formal_run_complete:boolean;formal_eligibility_confirmed:boolean;publication_status:'READY'|'HOLD';jev:PublicationContext['jev'];
 universe_count:number;reviewed_count:number;unresolved_count:number;candidate_count:number;selected_count:number;
 full_run_integrity:{algorithm:'SHA-256';serialization:'JSON.stringify';sha256:string;bytes:number;file_sha256?:string;result_sha256:string};
 selected:DisplayRow[];result:Pick<GrowthFeaturedResult,'state'|'message'|'manifest'>;
 currentness:{current:boolean;manifest:SelectionRun['manifest']};projection_sha256:string};
const sha=/^[a-f0-9]{64}$/;
const stamp=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const count=(v:unknown):v is number=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<=10000;
const day=(at:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(at);
async function digest(value:string):Promise<string>{
 const bytes=new TextEncoder().encode(value);
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function current(p:PublicationProjection,at:Date):boolean{
 const m=p.currentness.manifest,today=day(at),proof=m.freshnessProof;
 return p.currentness.current&&m.universeAsOf===today&&m.filingCoverageThrough===today&&m.ruleVersion===selectionVersion&&m.parserVersion===parserVersion&&
  proof?.day===today&&sha.test(proof.identityArchiveSha)&&sha.test(proof.dayListSha);
}
/** Copies the supplied formal output. It cannot discover, review, score or select companies. */
export async function createPublicationProjection(full:GrowthSnapshot,context:PublicationContext):Promise<PublicationProjection>{
 const r=context.result,m=full.selectionRun.manifest;
 if(!context.sourceGeneration||!m.snapshotId||r.generatedAt!==full.generatedAt||r.selectedCount!==r.selected.length||r.entries.length!==r.selectedCount||r.selectedCount>3||
  JSON.stringify(r.entries)!==JSON.stringify(r.selected)||r.state!=='COMPLETE'&&r.selectedCount||
  !count(r.candidateCount)||!count(m.coverage.masterReviewed)||m.coverage.masterReviewed>full.selectionRun.universe.length||
  context.fullRunFileSha256!==undefined&&!sha.test(context.fullRunFileSha256))throw Error('Invalid frozen publication result');
 const identities=new Set(full.selectionRun.universe.map(i=>i.code+'.JP'));
 if(new Set(r.selected.map(c=>c.symbol)).size!==r.selectedCount||r.selected.some(c=>!identities.has(c.symbol)))throw Error('Publication identity conflict');
 const serialized=JSON.stringify(full),selected=r.selected.map((c,index)=>({rank:index+1,companyName:c.companyName,symbol:c.symbol,fiscalDate:c.fiscalDate,
  observationScore:{...c.summaryScore},shortReason:c.researchStatus.shortReason,researchStatus:{...c.researchStatus}}));
 const p:PublicationProjection={version:publicationProjectionVersion,run_id:m.snapshotId,generated_at:full.generatedAt,source_generation:context.sourceGeneration,
  formal_run_complete:full.selectionRun.complete,formal_eligibility_confirmed:r.state==='COMPLETE',
  publication_status:full.selectionRun.complete&&r.state==='COMPLETE'&&context.jev.pre==='PASS'&&context.jev.post==='PASS'?'READY':'HOLD',jev:{...context.jev},
  universe_count:full.selectionRun.universe.length,reviewed_count:m.coverage.masterReviewed,unresolved_count:full.selectionRun.universe.length-m.coverage.masterReviewed,
  candidate_count:r.candidateCount,selected_count:r.selectedCount,
  full_run_integrity:{algorithm:'SHA-256',serialization:'JSON.stringify',sha256:await digest(serialized),bytes:new TextEncoder().encode(serialized).byteLength,
   ...(context.fullRunFileSha256?{file_sha256:context.fullRunFileSha256}:{}),result_sha256:await digest(JSON.stringify(r))},
  selected,result:{state:r.state,message:r.message,manifest:structuredClone(r.manifest)},
  // The existing metadata verifier needs only this bounded private manifest; evidence remains in the full run.
  currentness:{current:full.selectionRun.current,manifest:{...structuredClone(m),candidateEvidenceRefs:[],remainingUnknowns:[]}},projection_sha256:''};
 p.projection_sha256=await digest(JSON.stringify(p));
 if(new TextEncoder().encode(JSON.stringify(p)).byteLength>=26214400)throw Error('Publication projection exceeds KV value limit');
 return p;
}
export async function validatePublicationProjection(raw:unknown,clock:()=>Date):Promise<PublicationProjection>{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid publication projection');
 const p=raw as PublicationProjection,m=p.currentness?.manifest,coverage=p.result?.manifest?.coverage;
 if(p.version!==publicationProjectionVersion||typeof p.run_id!=='string'||!p.run_id||typeof p.source_generation!=='string'||!p.source_generation||
  typeof p.formal_run_complete!=='boolean'||typeof p.formal_eligibility_confirmed!=='boolean'||
  p.formal_eligibility_confirmed!==(p.result?.state==='COMPLETE')||!stamp(p.generated_at)||Date.parse(p.generated_at)>clock().getTime()||!['READY','HOLD'].includes(p.publication_status)||
  !['PASS','HOLD','UNVERIFIED'].includes(p.jev?.pre)||!['PASS','HOLD','UNVERIFIED'].includes(p.jev?.post)||
  ![p.universe_count,p.reviewed_count,p.unresolved_count,p.candidate_count,p.selected_count].every(count)||p.selected_count>3||
  p.reviewed_count+p.unresolved_count!==p.universe_count||p.candidate_count<p.selected_count||
  !Array.isArray(p.selected)||p.selected.length!==p.selected_count||new Set(p.selected.map(c=>c.symbol)).size!==p.selected_count||
  !['COMPLETE','IN_PROGRESS','RECHECK_REQUIRED','COMPARISON_REQUIRED'].includes(p.result?.state)||typeof p.result.message!=='string'||
  p.result.state!=='COMPLETE'&&p.selected_count||!coverage||Object.values(coverage).some(v=>!count(v))||
  !m||m.snapshotId!==p.run_id||typeof p.currentness.current!=='boolean'||
  !Array.isArray(m.candidateEvidenceRefs)||m.candidateEvidenceRefs.length||!Array.isArray(m.remainingUnknowns)||m.remainingUnknowns.length||
  p.full_run_integrity?.algorithm!=='SHA-256'||p.full_run_integrity.serialization!=='JSON.stringify'||!sha.test(p.full_run_integrity.sha256)||
  !sha.test(p.full_run_integrity.result_sha256)||!Number.isSafeInteger(p.full_run_integrity.bytes)||p.full_run_integrity.bytes<1||
  p.full_run_integrity.file_sha256!==undefined&&!sha.test(p.full_run_integrity.file_sha256)||!sha.test(p.projection_sha256))throw Error('Invalid publication projection contract');
 const ready=p.formal_run_complete&&p.formal_eligibility_confirmed&&p.result.state==='COMPLETE'&&p.jev.pre==='PASS'&&p.jev.post==='PASS';
 if((p.publication_status==='READY')!==ready||p.selected.some((c,i)=>c.rank!==i+1||!c.companyName||!c.symbol||
  !['GREEN','STAY'].includes(c.researchStatus?.status)||typeof c.shortReason!=='string'||!c.observationScore||
  c.observationScore.score!==null&&(!Number.isFinite(c.observationScore.score)||c.observationScore.score<0||c.observationScore.score>100)||
  !Number.isFinite(c.observationScore.coverage)||c.observationScore.coverage<0||c.observationScore.coverage>100||
  !['UNSCORED','PROVISIONAL','NORMAL'].includes(c.observationScore.display)))throw Error('Invalid frozen publication cards');
 if(await digest(JSON.stringify({...p,projection_sha256:''}))!==p.projection_sha256)throw Error('Publication projection integrity conflict');
 return p;
}
/** API compatibility envelope is assembled from the small projection only; no full run is loaded. */
export async function readPublicationProjection(raw:unknown,clock:()=>Date,verify?:(m:SelectionRun['manifest'])=>Promise<boolean>):Promise<GrowthFeaturedResult>{
 const p=await validatePublicationProjection(raw,clock);
 let state=p.result.state,checkedAt:string|null=null;
 if(state==='COMPLETE'){
  if(p.publication_status!=='READY'||!current(p,clock())||!verify||!await verify(p.currentness.manifest)||!current(p,clock()))state='RECHECK_REQUIRED';
  else checkedAt=clock().toISOString();
 }
 const selected:GrowthFeaturedCandidate[]=state==='COMPLETE'?p.selected.map(c=>({companyName:c.companyName,symbol:c.symbol,fiscalDate:c.fiscalDate,
  researchStatus:{...c.researchStatus},summaryScore:{...c.observationScore},rank:c.rank,runId:p.run_id,shortReason:c.shortReason,
  whyNow:[],keyNumbers:[],whatIsChanging:[],radarWhyNow:[],majorRisks:[],nextConfirmation:[],updatedAt:p.generated_at})):[];
 return {status:'ready',state,message:state===p.result.state?p.result.message:'正式Run・JEV・最新開示の確認を進めています。',
  manifest:structuredClone(p.result.manifest),generatedAt:p.generated_at,freshnessCheckedAt:checkedAt,candidateCount:p.candidate_count,
  selectedCount:selected.length,selected,entries:selected,uiState:selected.length?'READY':state==='COMPLETE'?'NO_QUALIFIED_CANDIDATES':'VERIFYING',
  publication:{runId:p.run_id,sourceGeneration:p.source_generation,status:state==='COMPLETE'?'READY':'HOLD',jev:{...p.jev},fullRunSha256:p.full_run_integrity.sha256}};
}
