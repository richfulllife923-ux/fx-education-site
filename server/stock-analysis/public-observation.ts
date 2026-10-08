import type {CompanyData,Datum,FinancialPeriod} from "./model";
import type {ResearchRunStore} from "./featured";
import {OBSERVATION_KEY,verifyObservationProjection,OBSERVATION_TOP5_SCHEMA,OBSERVATION_MODEL,OBSERVATION_TOP5_KEY,OBSERVATION_INPUT_KEY,OBSERVATION_REVIEW_KEY,observationDigest,verifyTop5Observation,type Top5ObservationProjection} from "../../lib/public-observation";

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
  if(new Set(rows.map(r=>r.code)).size!==rows.length || rows.some(r=>![r.growth,r.margin,r.cashMargin].every(Number.isFinite)))throw Error("OBSERVATION_COHORT_INVALID");
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

export type ObservationStore=ResearchRunStore & {put?:(key:string,value:string)=>Promise<void>};
type InputFact={name:string;value:number;source:Datum["source"];documentPeriod:string};
export type ObservationInput={
  schema:"tutto-public-observation-input/1";model:typeof OBSERVATION_MODEL;
  updated_at:string;data_observed_at:string;research_full_run_sha256:string;assessment_sha256:string;
  rows:{code:string;name:string;edinetCode:string;source_sha256:string;proof:InputFact[]}[];
  input_sha256:string;
};
const sha=(x:unknown)=>typeof x==="string" && /^[a-f0-9]{64}$/.test(x);
const date=(x:unknown):x is string=>typeof x==="string" && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(x) && Number.isFinite(Date.parse(x));
/** Recheck the same existing source/annual eligibility using sealed saved facts. */
export async function selectTop5Observation(value:unknown):Promise<Top5ObservationProjection>{
  const p=value as ObservationInput;
  if(!p || p.schema!=="tutto-public-observation-input/1" || p.model!==OBSERVATION_MODEL || !date(p.updated_at) || !date(p.data_observed_at) || Date.parse(p.data_observed_at)>Date.parse(p.updated_at) ||
    ![p.input_sha256,p.assessment_sha256,p.research_full_run_sha256].every(sha) || !Array.isArray(p.rows) || p.rows.length>3811 || new Set(p.rows.map(r=>r.code)).size!==p.rows.length ||
    await observationDigest({...p,input_sha256:""})!==p.input_sha256)throw Error("OBSERVATION_INPUT_INVALID");
  const metrics:ObservationMetrics[]=[];
  for(const r of p.rows){
    if(!/^E\d{5}$/.test(r.edinetCode) || !sha(r.source_sha256) || typeof r.name!=="string" || !r.name.trim() || r.name.length>=160 || !Array.isArray(r.proof) || r.proof.length!==4)throw Error("OBSERVATION_INPUT_INVALID");
    const get=(name:string)=>r.proof.filter(f=>f.name===name);
    if(["revenue","previousRevenue","operatingIncome","operatingCF"].some(name=>get(name).length!==1))throw Error("OBSERVATION_INPUT_INVALID");
    const [revenue,previousRevenue,operatingIncome,operatingCF]=["revenue","previousRevenue","operatingIncome","operatingCF"].map(name=>get(name)[0]);
    if(r.proof.some(f=>!f.source || !Number.isFinite(f.value) || !(f.documentPeriod===f.source.period || (f.name==="previousRevenue" && f.source.contextRef==="Prior1YearDuration" && f.documentPeriod===revenue.source.period))))throw Error("OBSERVATION_INPUT_INVALID");
    const current={end:revenue.source.period,basis:"annual",currency:"JPY",revenue,operatingIncome,operatingCF};
    const previous={end:previousRevenue.source.period,basis:"annual",currency:"JPY",revenue:previousRevenue};
    const company={provider:"EDINET",identity:{country:"JP",code:r.code,name:r.name,edinetCode:r.edinetCode},annual:[current,previous]} as unknown as CompanyData;
    const m=observationMetrics(company,p.updated_at);
    if(m)metrics.push(m); // Ineligible data stays in saved input; never impute or pad.
  }
  const ranked=rankObservations(metrics);
  const projection:Top5ObservationProjection={schema:OBSERVATION_TOP5_SCHEMA,mode:"PUBLIC_OBSERVATION",model:OBSERVATION_MODEL,
    run_id:"observation-"+p.input_sha256.slice(0,24),generated_at:p.updated_at,data_observed_at:p.data_observed_at,publication_status:"READY",
    cohort_count:metrics.length,selected_count:Math.min(5,metrics.length),top5:ranked.slice(0,5).map((r,i)=>({rank:i+1,code:r.code,name:r.name,score:r.score,period:r.period})),
    integrity:{research_full_run_sha256:p.research_full_run_sha256,assessment_sha256:p.assessment_sha256,input_sha256:p.input_sha256},projection_sha256:""};
  projection.projection_sha256=await observationDigest(projection);
  return verifyTop5Observation(projection);
}
/** Actual external release PRE/POST receipts, independent from Formal Research JEV. */
async function verifyPublicReview(store:ObservationStore,p:Top5ObservationProjection){
  const r=await store.get(OBSERVATION_REVIEW_KEY,"json") as {scope?:string;input_sha256?:string;projection_sha256?:string;pre?:{status?:string;request_id?:string;response_sha256?:string};post?:{status?:string;request_id?:string;response_sha256?:string}}|null;
  if(!r || r.scope!=="PUBLIC_OBSERVATION_TOP5" || r.input_sha256!==p.integrity.input_sha256 || r.projection_sha256!==p.projection_sha256 ||
     [r.pre,r.post].some(j=>j?.status!=="PASS" || !j.request_id || !sha(j.response_sha256)))throw Error("OBSERVATION_REVIEW_HOLD");
}
export async function readTop5Observation(store?:ObservationStore){
  if(!store)throw Error("OBSERVATION_STORE_UNAVAILABLE");
  const p=await verifyTop5Observation(await store.get(OBSERVATION_TOP5_KEY,"json"));await verifyPublicReview(store,p);return p;
}
export async function refreshTop5Observation(store?:ObservationStore){
  if(!store?.put)throw Error("OBSERVATION_STORE_UNAVAILABLE");
  const p=await selectTop5Observation(await store.get(OBSERVATION_INPUT_KEY,"json"));await verifyPublicReview(store,p);
  const previous=await store.get(OBSERVATION_TOP5_KEY,"json");
  // Identical generation/result retains the same update time and requires no write.
  if(!previous || (previous as Top5ObservationProjection).projection_sha256!==p.projection_sha256 || JSON.stringify(previous)!==JSON.stringify(p))await store.put(OBSERVATION_TOP5_KEY,JSON.stringify(p));
  return p;
}
