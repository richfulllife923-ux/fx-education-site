
import { PrimaryHttp } from "./primary-http";
import type { SelectionManifest } from "../../lib/top3-selection";
// One worker-local queue. No retry, proxy, SEC, paid API or browser impersonation.
const queue=new PrimaryHttp(async(input,init)=>{
 const response=await globalThis.fetch(input,{...init,redirect:"manual"});
 if(response.status>=300&&response.status<400){await response.body?.cancel();throw new Error("Official redirect rejected");}return response;
},1100);
const canonical=(v:unknown):unknown=>Array.isArray(v)?v.map(canonical):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical((v as Record<string,unknown>)[k])])):v;
async function sha(data:Uint8Array):Promise<string>{const digest=await crypto.subtle.digest("SHA-256",data);return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,"0")).join("");}
export async function verifyFeaturedCurrentness(manifest:SelectionManifest,key?:string):Promise<boolean>{
 const proof=manifest.freshnessProof;if(!key?.trim()||!proof||proof.day!==manifest.filingCoverageThrough)return false;
 const identity=await queue.get("https://disclosure2dl.edinet-fsa.go.jp/searchdocument/codelist/Edinetcode.zip","top3-identity",0);
 if(await sha(identity.bytes)!==proof.identityArchiveSha)return false;
 const list=await queue.json("https://api.edinet-fsa.go.jp/api/v2/documents.json?date="+proof.day+"&type=2&Subscription-Key="+encodeURIComponent(key),"top3-day."+proof.day,0);
 const body=list.data as {metadata?:{status?:string};results?:{docID?:string}[]};
 if(String(body.metadata?.status)!=="200"||!Array.isArray(body.results))return false;
 const sorted=[...body.results].sort((a,b)=>String(a.docID).localeCompare(String(b.docID)));
 return await sha(new TextEncoder().encode(JSON.stringify(canonical(sorted))))===proof.dayListSha;
}
