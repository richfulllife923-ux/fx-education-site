import { StockError } from "./model";
export type Retrieved = { bytes:Uint8Array; retrievedAt:string };
export class PrimaryHttp {
  private cache=new Map<string,{expires:number;result:Retrieved}>();
  private pending=new Map<string,Promise<Retrieved>>();
  private queue:Promise<unknown>=Promise.resolve();
  private lastStart=0;
  private totalBytes=0;
  private cooldown?:{until:number;error:StockError};
  constructor(private fetcher:typeof fetch=fetch,private interval=1100,private clock:()=>Date=()=>new Date()) {}
  get(url:string,cacheKey:string,ttl:number,headers:Record<string,string>={}):Promise<Retrieved> {
    const cached=this.cache.get(cacheKey);
    if(cached && cached.expires>Date.now())return Promise.resolve(cached.result);
    if(cached){this.totalBytes-=cached.result.bytes.length;this.cache.delete(cacheKey);}
    if(this.cooldown && this.cooldown.until>Date.now())return Promise.reject(this.cooldown.error);
    const pending=this.pending.get(cacheKey);if(pending)return pending;
    if(this.pending.size>=12)return Promise.reject(new StockError("RATE_LIMITED","一次資料の取得待ち上限に達しました。少し待って再試行してください。"));
    const task=this.queue.catch(()=>undefined).then(async()=>{
      if(this.cooldown && this.cooldown.until>Date.now())throw this.cooldown.error;
      const wait=this.interval-(Date.now()-this.lastStart);
      if(wait>0)await new Promise(resolve=>setTimeout(resolve,wait));
      this.lastStart=Date.now();
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
      try {
        const response=await this.fetcher(url,{headers,signal:controller.signal,redirect:"error"});
        if(!response.ok)await response.body?.cancel();
        if(response.status===429)throw new StockError("RATE_LIMITED","一次資料APIの利用上限です。自動連続再試行は行いません。");
        if([401,403].includes(response.status))throw new StockError("CONFIGURATION_REQUIRED",response.status===403?"一次資料APIがアクセスを拒否しました（HTTP 403）。User-Agent設定と接続元のアクセス条件を確認してください。":"一次資料APIのサーバー専用キー・認証設定を確認してください。");
        if(response.status===404)throw new StockError("FINANCIALS_UNAVAILABLE","該当する一次資料を取得できませんでした。");
        if(!response.ok || !response.body)throw new StockError("DATA_PROVIDER_ERROR","一次資料APIに接続できませんでした。");
        if(Number(response.headers.get("content-length"))>20*1024*1024)throw new Error("size");
        const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
        for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;
          if(size>20*1024*1024){await reader.cancel();throw new Error("size");}chunks.push(value);}
        const bytes=new Uint8Array(size);let offset=0;chunks.forEach(chunk=>{bytes.set(chunk,offset);offset+=chunk.length;});
        const result={bytes,retrievedAt:this.clock().toISOString()};
        if(ttl>0 && size<=12*1024*1024){
          while(this.cache.size>=32 || this.totalBytes+size>16*1024*1024){
            const oldest=this.cache.keys().next().value;if(oldest===undefined)break;
            this.totalBytes-=this.cache.get(oldest)!.result.bytes.length;this.cache.delete(oldest);
          }
          this.cache.set(cacheKey,{expires:Date.now()+ttl,result});this.totalBytes+=size;
        }
        return result;
      }catch(error){if(error instanceof StockError){if(error.code==="RATE_LIMITED" || error.code==="CONFIGURATION_REQUIRED")this.cooldown={until:Date.now()+60000,error};throw error;}throw new StockError("DATA_PROVIDER_ERROR","一次資料の取得がタイムアウトしたか、応答の読み取りに失敗しました。");}
      finally{clearTimeout(timeout);}
    }).finally(()=>this.pending.delete(cacheKey));
    this.pending.set(cacheKey,task);this.queue=task;return task;
  }
  async json(url:string,key:string,ttl:number,headers:Record<string,string>={}):Promise<{data:unknown;retrievedAt:string}> {
    const result=await this.get(url,key,ttl,headers);
    try{return {data:JSON.parse(new TextDecoder().decode(result.bytes)),retrievedAt:result.retrievedAt};}
    catch{throw new StockError("DATA_PROVIDER_ERROR","一次資料APIのJSON形式を確認できませんでした。");}
  }
}
