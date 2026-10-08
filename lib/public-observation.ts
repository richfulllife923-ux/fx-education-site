/** Public annual-data observation. Independent of Formal Research and its score. */
export const OBSERVATION_SCHEMA = "tutto-public-observation/1" as const;
export const OBSERVATION_MODEL = "annual-percentile-geometric-mean/1" as const;
export const OBSERVATION_KEY = "top3-public-observation";
export type ObservationRow = {rank:number;code:string;name:string;score:number;period:string};
export type ObservationProjection = {
  schema:typeof OBSERVATION_SCHEMA; mode:"PUBLIC_OBSERVATION"; model:typeof OBSERVATION_MODEL;
  run_id:string; generated_at:string; data_observed_at:string; publication_status:"READY";
  cohort_count:number; top3:ObservationRow[];
  integrity:{research_full_run_sha256:string;assessment_sha256:string}; projection_sha256:string;
};
const hashPattern=/^[a-f0-9]{64}$/;
const timestamp=(x:unknown):x is string=>typeof x==="string" && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(x) && Number.isFinite(Date.parse(x));
export function isObservationProjection(x:unknown):x is ObservationProjection {
  if(!x || typeof x!=="object")return false;
  const p=x as ObservationProjection;
  return p.schema===OBSERVATION_SCHEMA && p.mode==="PUBLIC_OBSERVATION" && p.model===OBSERVATION_MODEL && p.publication_status==="READY" &&
    typeof p.run_id==="string" && /^observation-[a-f0-9]{24}$/.test(p.run_id) && timestamp(p.generated_at) && timestamp(p.data_observed_at) && Date.parse(p.data_observed_at)<=Date.parse(p.generated_at) &&
    Number.isInteger(p.cohort_count) && p.cohort_count>=3 && !!p.integrity && hashPattern.test(p.integrity.research_full_run_sha256) && hashPattern.test(p.integrity.assessment_sha256) && hashPattern.test(p.projection_sha256) &&
    Array.isArray(p.top3) && p.top3.length===3 && new Set(p.top3.map(r=>r.code)).size===3 &&
    p.top3.every((r,i)=>r.rank===i+1 && /^[0-9]{3}[0-9A-Z]$/.test(r.code) && typeof r.name==="string" && r.name.trim().length>0 && r.name.length<160 &&
      Number.isFinite(r.score) && r.score>=0 && r.score<=100 && (i===0 || p.top3[i-1].score>=r.score) && /^\d{4}-\d{2}-\d{2}$/.test(r.period) && Number.isFinite(Date.parse(r.period)) && Date.parse(r.period)<=Date.parse(p.data_observed_at));
}
export async function observationDigest(value:unknown):Promise<string> {
  const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,"0")).join("");
}
export async function verifyObservationProjection(value:unknown):Promise<ObservationProjection> {
  if(!isObservationProjection(value))throw Error("OBSERVATION_INVALID");
  if(await observationDigest({...value,projection_sha256:""})!==value.projection_sha256)throw Error("OBSERVATION_INTEGRITY_FAILED");
  return value;
}
export async function loadObservation(signal:AbortSignal):Promise<ObservationProjection> {
  const response=await fetch("/api/stock-analysis/observation",{signal,cache:"no-store"});
  if(!response.ok)throw Error("OBSERVATION_UNAVAILABLE");
  return verifyObservationProjection(await response.json());
}

/** Versioned public display; the legacy three-result API remains compatible. */
export const OBSERVATION_TOP5_SCHEMA="tutto-public-observation/2" as const;
export const OBSERVATION_TOP5_KEY="top5-public-observation";
export const OBSERVATION_INPUT_KEY="public-observation-input";
export const OBSERVATION_REVIEW_KEY="top5-public-observation-review";
export type Top5ObservationProjection=Omit<ObservationProjection,"schema"|"top3"|"integrity"> & {
  schema:typeof OBSERVATION_TOP5_SCHEMA; selected_count:number; top5:ObservationRow[];
  integrity:ObservationProjection["integrity"] & {input_sha256:string};
};
export async function verifyTop5Observation(value:unknown):Promise<Top5ObservationProjection>{
  if(!value || typeof value!=="object")throw Error("OBSERVATION_INVALID");
  const p=value as Top5ObservationProjection;
  if(p.schema!==OBSERVATION_TOP5_SCHEMA || p.mode!=="PUBLIC_OBSERVATION" || p.model!==OBSERVATION_MODEL || p.publication_status!=="READY" ||
     !/^observation-[a-f0-9]{24}$/.test(p.run_id) || !timestamp(p.generated_at) || !timestamp(p.data_observed_at) || Date.parse(p.data_observed_at)>Date.parse(p.generated_at) ||
     !Number.isInteger(p.cohort_count) || p.cohort_count<0 || p.cohort_count>3811 || !Array.isArray(p.top5) || p.top5.length!==Math.min(5,p.cohort_count) ||
     p.selected_count!==p.top5.length || new Set(p.top5.map(r=>r.code)).size!==p.top5.length || !p.integrity ||
     ![p.integrity.input_sha256,p.integrity.research_full_run_sha256,p.integrity.assessment_sha256,p.projection_sha256].every(h=>typeof h==="string" && hashPattern.test(h)) ||
     !p.top5.every((r,i)=>r.rank===i+1 && /^[0-9]{3}[0-9A-Z]$/.test(r.code) && typeof r.name==="string" && r.name.trim().length>0 && r.name.length<160 &&
       Number.isInteger(r.score) && r.score>=0 && r.score<=100 && (i===0 || p.top5[i-1].score>=r.score) && /^\d{4}-\d{2}-\d{2}$/.test(r.period) && Number.isFinite(Date.parse(r.period)) && Date.parse(r.period)<=Date.parse(p.data_observed_at)))throw Error("OBSERVATION_INVALID");
  if(await observationDigest({...p,projection_sha256:""})!==p.projection_sha256)throw Error("OBSERVATION_INTEGRITY_FAILED");
  return p;
}
export async function loadTop5Observation(signal:AbortSignal,refresh=false):Promise<Top5ObservationProjection>{
  const response=await fetch(`/api/stock-analysis/${refresh?"observation-refresh":"observation-v2"}`,{method:refresh?"POST":"GET",signal,cache:"no-store"});
  if(!response.ok)throw Error("OBSERVATION_UNAVAILABLE");
  return verifyTop5Observation(await response.json());
}
