import {readPublicObservation,readTop5Observation,refreshTop5Observation,type ObservationStore} from "../../../server/stock-analysis/public-observation";
import { verifyFeaturedCurrentness } from '../../../server/stock-analysis/top3-freshness';
import {EvidenceCollector} from "../../../server/stock-analysis/research-evidence/extraction";
import type { ResearchRunStore } from "../../../server/stock-analysis/featured";
import {readGrowthFeatured} from "../../../server/stock-analysis/growth-radar/pipeline";
import { FreeProvider } from "../../../server/stock-analysis/free";
import type { EdinetIndex } from "../../../server/stock-analysis/edinet";
import { EodhdProvider } from "../../../server/stock-analysis/eodhd";
import { AnalysisService, failure } from "../../../server/stock-analysis/service";
import { StockError } from "../../../server/stock-analysis/model";
export type Env = {
  TOP3_RESEARCH_RUN?:ObservationStore;
  STOCK_DATA_MODE?:"FREE"|"EODHD"; SEC_CONTACT_EMAIL?:string; EDINET_API_KEY?:string;
  SEC_LIVE_ENABLED?:string; SEC_PUBLIC_RELEASE_APPROVED?:string;
  EDINET_FILING_INDEX?:{get(key:string,type:"json"):Promise<EdinetIndex|null>};
  EODHD_API_KEY?:string; EODHD_PUBLIC_DISPLAY_APPROVED?:string;
  EODHD_CACHE_APPROVED?:string; TUTTO_WATCHLIST_SYMBOLS?:string;
  STOCK_RATE_LIMITER?:{limit(options:{key:string}):Promise<{success:boolean}>};
};
type Context = {request:Request;env:Env};
const sessions=new Map<string,AnalysisService>();
const rateWindows=new Map<string,{count:number;start:number}>();
async function hash(value:string):Promise<string> {
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,"0")).join("");
}
async function configured(env:Env):Promise<AnalysisService> {
  const commercial=env.STOCK_DATA_MODE==="EODHD";
  if(env.STOCK_DATA_MODE && !["FREE","EODHD"].includes(env.STOCK_DATA_MODE))throw new StockError("CONFIGURATION_REQUIRED","データモードの設定を確認してください。");
  if (commercial && (!env.EODHD_API_KEY?.trim() || env.EODHD_PUBLIC_DISPLAY_APPROVED!=="true"))
    throw new StockError("CONFIGURATION_REQUIRED","分析データの公開利用権限またはサーバーの秘密鍵が未設定です。企業データは取得していません。");
  // The legacy commercial mode cannot bypass the Japan-only publication gate.
  if(commercial && !(env.SEC_LIVE_ENABLED==="true" && env.SEC_PUBLIC_RELEASE_APPROVED==="true"))
    throw new StockError("CONFIGURATION_REQUIRED","日本株先行公開はFREE MODEで利用してください。米国株の実データ分析は一次資料接続の確認中のため停止しています。");
  const index=!commercial && env.EDINET_FILING_INDEX?await env.EDINET_FILING_INDEX.get("edinet-filings","json"):undefined;
  if(index && (index.version!==1 || !Array.isArray(index.filings) || index.filings.length>100000))throw new StockError("CONFIGURATION_REQUIRED","EDINET索引の形式を確認してください。");
  const key=await hash([env.STOCK_DATA_MODE??"FREE",env.SEC_LIVE_ENABLED,env.SEC_PUBLIC_RELEASE_APPROVED,env.SEC_CONTACT_EMAIL,env.EDINET_API_KEY,env.EODHD_API_KEY,env.EODHD_CACHE_APPROVED,index?.retrievedAt].join("|"));
  let service=sessions.get(key);
  if (!service) {
    if (sessions.size>=2) sessions.delete(sessions.keys().next().value!);
    // Native Workers fetch rejects a provider instance as its receiver.
    const serverFetch:typeof fetch=async(input,init)=>{
      // Workers supports manual/follow only; preserve rejection without forwarding secrets.
      const response=await globalThis.fetch(input,init?.redirect==="error"?{...init,redirect:"manual"}:init);
      if(init?.redirect==="error" && response.status>=300 && response.status<400){
        await response.body?.cancel();
        throw new StockError("DATA_PROVIDER_ERROR","一次資料APIに接続できませんでした。");
      }
      return response;
    };
    const evidenceCollector=commercial?undefined:new EvidenceCollector();
    const evidenceFetch=evidenceCollector?evidenceCollector.wrap(serverFetch):serverFetch;
    service=new AnalysisService(commercial?
      new EodhdProvider(env.EODHD_API_KEY!,serverFetch,()=>new Date(),env.EODHD_CACHE_APPROVED==="true"):
      new FreeProvider(env.SEC_CONTACT_EMAIL,env.EDINET_API_KEY,index??undefined,evidenceFetch,()=>new Date(),1100,env.SEC_LIVE_ENABLED==="true" && env.SEC_PUBLIC_RELEASE_APPROVED==="true"),evidenceCollector?company=>evidenceCollector.bundle(company):undefined);
    sessions.set(key,service);
  }
  return service;
}
function json(body:unknown,status=200):Response {
  return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
async function limit(request:Request,env:Env):Promise<void> {
  // Hash addresses in transient memory only; no logging/persistence. Optional CF distributed binding.
  const key=await hash(request.headers.get("CF-Connecting-IP")??"local");
  if (env.STOCK_RATE_LIMITER) {
    if (!(await env.STOCK_RATE_LIMITER.limit({key})).success) throw new StockError("RATE_LIMITED","利用上限に達しました。時間をおいて再試行してください。");
  } else {
    const now=Date.now(),window=rateWindows.get(key);
    if (rateWindows.size>2048) { for (const [name,value] of rateWindows) if(now-value.start>60000)rateWindows.delete(name); }
    if (!window || now-window.start>60000) { if (rateWindows.size>=4096) rateWindows.clear();rateWindows.set(key,{count:1,start:now}); }
    else if (++window.count>12) throw new StockError("RATE_LIMITED","利用上限に達しました。1分ほど待って再試行してください。");
  }
}
export async function onRequest({request,env}:Context):Promise<Response> {
  try {
    const url=new URL(request.url), endpoint=url.pathname.replace(/\/+$/,"").split("/").pop();
    if (!["analyze","compare","watchlist","emerging","featured","observation","observation-v2","observation-refresh"].includes(endpoint??"")) return json({status:"error",code:"INVALID_INPUT",message:"API endpoint not found."},404);
    if (request.method!==(["watchlist","featured","observation","observation-v2"].includes(endpoint??"")?"GET":"POST")) return json({status:"error",code:"INVALID_INPUT",message:"HTTP method not supported."},405);
    const origin=request.headers.get("Origin");
    if (origin && origin!==url.origin) return json({status:"error",code:"INVALID_INPUT",message:"同一サイトからのリクエストが必要です。"},403);
    await limit(request,env);
    if(endpoint==="observation-v2" || endpoint==="observation-refresh"){
      try{return json(await (endpoint==="observation-refresh"?refreshTop5Observation:readTop5Observation)(env.TOP3_RESEARCH_RUN));}
      catch{return json({status:"unavailable",mode:"PUBLIC_OBSERVATION",message:"評価結果を確認できません。"},503);}
    }
    if(endpoint==="observation"){
      try{return json(await readPublicObservation(env.TOP3_RESEARCH_RUN));}
      catch{return json({status:"unavailable",mode:"PUBLIC_OBSERVATION",message:"保存済みの評価を取得できません。"},503);}
    }
    if(endpoint==="featured")return json(await readGrowthFeatured(env.TOP3_RESEARCH_RUN,()=>new Date(),manifest=>verifyFeaturedCurrentness(manifest,env.EDINET_API_KEY)));
    const service=await configured(env);
    if (endpoint==="watchlist") {
      const symbols=(env.TUTTO_WATCHLIST_SYMBOLS??"").split(",").map(value=>value.trim()).filter(Boolean).slice(0,4);
      return json(await service.watchlist(symbols));
    }
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) throw new StockError("INVALID_INPUT","JSON形式で入力してください。");
    if (Number(request.headers.get("content-length"))>1024) throw new StockError("INVALID_INPUT","入力が長すぎます。");
    const reader=request.body?.getReader();
    if (!reader) throw new StockError("INVALID_INPUT","入力がありません。");
    let raw="",length=0;
    const decoder=new TextDecoder();
    for (;;) { const {done,value}=await reader.read();if(done)break;length+=value.byteLength;
      if(length>1024){await reader.cancel();throw new StockError("INVALID_INPUT","入力が長すぎます。");}raw+=decoder.decode(value,{stream:true}); }
    raw+=decoder.decode();
    let data:Record<string,unknown>;
    try { data=JSON.parse(raw);if (!data || typeof data!=="object" || Array.isArray(data))throw new Error(); }
    catch { throw new StockError("INVALID_INPUT","入力形式を確認してください。"); }
    if (endpoint==="compare") {
      if(typeof data.a!=="string" || typeof data.b!=="string")throw new StockError("INVALID_INPUT","比較する2銘柄を入力してください。");
      return json(await service.compare(data.a,data.b));
    }
    if(typeof data.input!=="string")throw new StockError("INVALID_INPUT","銘柄名またはコードを入力してください。");
    // Emerging shares the same complete analysis; never returns an unsupported screening verdict.
    const result=await service.analyze(data.input,endpoint==="emerging"?"EMERGING":"STANDARD");
    return json(result,result.status==="ready"?200:["CONFIGURATION_REQUIRED","US_PRIMARY_SOURCE_TEMPORARILY_UNAVAILABLE"].includes(result.code??"")?503:result.code==="RATE_LIMITED"?429:result.code==="SYMBOL_NOT_FOUND"?404:result.code==="AMBIGUOUS_SYMBOL"?409:result.code==="INVALID_INPUT"?400:502);
  } catch (error) {
    const result=failure(error);
    return json(result,["CONFIGURATION_REQUIRED","US_PRIMARY_SOURCE_TEMPORARILY_UNAVAILABLE"].includes(result.code??"")?503:result.code==="RATE_LIMITED"?429:result.code==="INVALID_INPUT"?400:result.code==="SYMBOL_NOT_FOUND"?404:result.code==="AMBIGUOUS_SYMBOL"?409:502);
  }
}
