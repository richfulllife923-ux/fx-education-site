import type { FeaturedResult } from "./top3-selection";
export async function loadFeatured(signal:AbortSignal):Promise<FeaturedResult>{
 const response=await fetch("/api/stock-analysis/featured",{signal,cache:"no-store"});
 if(!response.ok)throw new Error("Featured unavailable");
 const data=await response.json() as FeaturedResult;
 if(data.status!=="ready"||!Array.isArray(data.entries)||data.entries.length>3||!data.manifest||
 !["COMPLETE","IN_PROGRESS","RECHECK_REQUIRED","COMPARISON_REQUIRED"].includes(data.state)||
 data.entries.some(e=>e.researchStatus?.status==="GRAY")||(data.state!=="COMPLETE"&&data.entries.length))throw new Error("Invalid featured snapshot");
 return data;
}
