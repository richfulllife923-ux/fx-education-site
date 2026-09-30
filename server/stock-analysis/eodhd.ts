import {
  StockError, dateOrNull, numberOrNull, publicUrl, record, textOrNull,
  type Candidate, type CompanyData, type Datum, type FinancialPeriod, type Source, type StockProvider,
} from "./model";
const docs = "https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds";
export class EodhdProvider implements StockProvider {
  constructor(private key:string, private fetcher:typeof fetch = fetch, private now:()=>Date=()=>new Date(), private cacheApproved=false) {
    if (!key.trim() || key.trim().toLowerCase()==="demo") throw new StockError("CONFIGURATION_REQUIRED","本番用データキーをサーバーに設定してください。");
  }
  private cache = new Map<string,{expires:number;value:unknown;bytes:number;retrievedAt:string}>();
  private fetchedAt = new Map<string,string>();
  private pending = new Map<string,Promise<unknown>>();
  private cacheBytes = 0;
  private requestWindow = {start:Date.now(),count:0};
  private async request(path:string,params:Record<string,string>={}):Promise<unknown> {
    const key=path+"?"+new URLSearchParams(params).toString(),now=Date.now();
    const entry=this.cache.get(key);
    if(entry && entry.expires>now){this.fetchedAt.set(key,entry.retrievedAt);return entry.value;}
    if(entry){this.cacheBytes-=entry.bytes;this.cache.delete(key);}
    const active=this.pending.get(key);if(active)return active;
    if(this.pending.size>=12)throw new StockError("RATE_LIMITED","同時取得の上限に達しました。時間をおいて再試行してください。");
    if(Date.now()-this.requestWindow.start>60000)this.requestWindow={start:Date.now(),count:0};
    if(++this.requestWindow.count>120)throw new StockError("RATE_LIMITED","サーバーの取得上限に達しました。時間をおいて再試行してください。");
    const task=this.requestUncached(path,params).then(value=>{
      if(this.fetchedAt.size>=64)this.fetchedAt.delete(this.fetchedAt.keys().next().value!);
      this.fetchedAt.set(key,this.now().toISOString());
      if(this.cacheApproved){
        const ttl=path.startsWith("v1.1/fundamentals/")?21600000:path.startsWith("real-time/")?30000:path.startsWith("search/")?600000:3600000;
        const bytes=JSON.stringify(value).length*2;
        while(this.cache.size>=32 || this.cacheBytes+bytes>8*1024*1024){
          const oldest=this.cache.keys().next().value;if(oldest===undefined)break;
          this.cacheBytes-=this.cache.get(oldest)!.bytes;this.cache.delete(oldest);
        }
        if(bytes<=8*1024*1024){this.cache.set(key,{expires:Date.now()+ttl,value,bytes,retrievedAt:this.fetchedAt.get(key)!});this.cacheBytes+=bytes;}
      }
      return value;
    }).finally(()=>this.pending.delete(key));
    this.pending.set(key,task);return task;
  }
  private async requestUncached(path:string,params:Record<string,string>={}):Promise<unknown> {
    const url = new URL("https://eodhd.com/api/"+path);
    url.searchParams.set("api_token",this.key);
    url.searchParams.set("fmt","json");
    Object.entries(params).forEach(([name,value])=>url.searchParams.set(name,value));
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),12000);
    try {
      const response = await this.fetcher(url.href,{signal:controller.signal,redirect:"error",headers:{Accept:"application/json"}});
      if (response.status===429) throw new StockError("RATE_LIMITED","データ提供元の利用上限に達しました。時間をおいて再試行してください。");
      if ([401,403].includes(response.status)) throw new StockError("DATA_PROVIDER_ERROR","データ取得権限を確認できません。管理者による契約・環境設定の確認が必要です。");
      if (response.status===404) throw new StockError("SYMBOL_NOT_FOUND","提供元で銘柄データを確認できませんでした。");
      if (!response.ok) throw new StockError("DATA_PROVIDER_ERROR","データ提供元で一時的なエラーが発生しました。");
      if (Number(response.headers.get("content-length"))>8*1024*1024 || !response.body)
        throw new StockError("DATA_PROVIDER_ERROR","提供元の応答を安全に読み取れませんでした。");
      const reader=response.body.getReader(), chunks:Uint8Array[]=[];
      let length=0;
      for (;;) {
        const {done,value}=await reader.read(); if (done) break;
        length+=value.byteLength;
        if (length>8*1024*1024) { await reader.cancel(); throw new StockError("DATA_PROVIDER_ERROR","提供元の応答が上限を超えました。"); }
        chunks.push(value);
      }
      const bytes=new Uint8Array(length); let offset=0;
      chunks.forEach(chunk=>{bytes.set(chunk,offset);offset+=chunk.byteLength;});
      const result:unknown=JSON.parse(new TextDecoder().decode(bytes));
      if (record(result).error || record(result).errors) throw new StockError("DATA_PROVIDER_ERROR","提供元の応答形式を確認できませんでした。");
      return result;
    } catch (error) {
      if (error instanceof StockError) throw error;
      // Never return fetch exceptions, URLs, token-bearing payloads or provider response bodies.
      throw new StockError("DATA_PROVIDER_ERROR","取得がタイムアウトしたか、データ提供元に接続できませんでした。");
    } finally { clearTimeout(timeout); }
  }
  async search(query:string):Promise<Candidate[]> {
    // Query both supported markets. Numerical codes are verified, not assumed to be Japanese.
    const responses=await Promise.all(["US","TSE"].map(exchange=>this.request("search/"+encodeURIComponent(query),{exchange,type:"stock",limit:"20"})));
    const candidates:Candidate[]=[];
    for (const response of responses) {
      if (!Array.isArray(response)) throw new StockError("DATA_PROVIDER_ERROR","銘柄検索の応答形式を確認できませんでした。");
      for (const item of response) {
        const row=record(item), code=textOrNull(row.Code)?.toUpperCase(), exchange=row.Exchange;
        if (!code || !/^[A-Z0-9_-]{1,20}$/.test(code) || (exchange!=="US" && exchange!=="TSE") || !textOrNull(row.Name)) continue;
        if (row.Type!=="Common Stock" || (exchange==="US" && !["USA","United States","US"].includes(String(row.Country))) ||
          (exchange==="TSE" && row.Country!=="Japan")) continue;
        candidates.push({symbol:code+"."+exchange,code,exchange,name:String(row.Name),country:exchange==="US"?"US":"JP",
          currency:typeof row.Currency==="string" && /^[A-Z]{3}$/.test(row.Currency)?row.Currency:null});
      }
    }
    return candidates;
  }
  async company(candidate:Candidate):Promise<CompanyData> {
    const today=this.now().toISOString().slice(0,10);
    const to=new Date(this.now().getTime()+180*86400000).toISOString().slice(0,10);
    const [fundResult,quoteResult,earningsResult]=await Promise.allSettled([
      this.request("v1.1/fundamentals/"+encodeURIComponent(candidate.symbol)),
      this.request("real-time/"+encodeURIComponent(candidate.symbol)),
      this.request("calendar/earnings",{symbols:candidate.symbol,from:today,to}),
    ]);
    if (fundResult.status==="rejected") throw fundResult.reason;
    const retrievedAt=this.fetchedAt.get("v1.1/fundamentals/"+encodeURIComponent(candidate.symbol)+"?")??this.now().toISOString();
    const raw=record(fundResult.value), general=record(raw.General), financials=record(raw.Financials);
    if (general.Code!==candidate.code || general.CountryISO!==candidate.country ||
      general.Type!=="Common Stock" || !textOrNull(general.Name))
      throw new StockError("DATA_PROVIDER_ERROR","銘柄の企業・国・種類を照合できませんでした。分析を停止しました。");
    const quoteCurrency=typeof general.CurrencyCode==="string" && /^[A-Z]{3}$/.test(general.CurrencyCode)?general.CurrencyCode:null;
    if (candidate.currency && quoteCurrency && candidate.currency!==quoteCurrency)
      throw new StockError("DATA_PROVIDER_ERROR","検索と企業データの取引通貨が一致しません。");
    const updatedAt=dateOrNull(general.UpdatedAt);
    const source=(field:string,basis:Source["basis"],period:string|null,currency:string|null,unit="currency",asOf:string|null=updatedAt):Source=>({
      provider:"EODHD",url:docs,title:"EODHD集計データ（一次開示との照合は未実施）",retrievedAt,asOf,field,basis,period,currency,unit,
    });
    const datum=(value:unknown,field:string,basis:Source["basis"],period:string|null,currency:string|null,unit="currency"):Datum=>({
      value:numberOrNull(value),source:source(field,basis,period,currency,unit),
    });
    const normalizePeriods=(basis:"annual"|"quarterly"):FinancialPeriod[]=>{
      const key=basis==="annual"?"yearly":"quarterly";
      const statements=["Income_Statement","Cash_Flow","Balance_Sheet"].map(name=>record(financials[name]));
      const tables=statements.map(statement=>record(statement[key]));
      const dates=[...new Set(tables.flatMap(table=>Object.keys(table)))].filter(date=>dateOrNull(date)!==null && date<=today).sort().reverse().slice(0,basis==="annual"?5:8);
      return dates.map(end=>{
        const [income,cf,balance]=tables.map(table=>record(table[end]));
        const curr=(row:Record<string,unknown>,index:number):string|null=>{
          const value=row.currency_symbol??statements[index].currency_symbol;
          return typeof value==="string" && /^[A-Z]{3}$/.test(value)?value:null;
        };
        const incCurrency=curr(income,0), cfCurrency=curr(cf,1), balanceCurrency=curr(balance,2);
        const get=(index:number,row:Record<string,unknown>,field:string,currency:string|null,unit="currency")=>{
          const item=datum(row[field],"Financials."+["Income_Statement","Cash_Flow","Balance_Sheet"][index]+"."+key+"."+end+"."+field,basis,end,currency,unit);
          item.source.filingDate=dateOrNull(row.filing_date); return item;
        };
        const inc=(field:string)=>get(0,income,field,incCurrency);
        const cash=(field:string)=>get(1,cf,field,cfCurrency);
        const bal=(field:string,unit="currency")=>get(2,balance,field,balanceCurrency,unit);
        const capex=cash("capitalExpenditures");
        if (capex.value!==null) capex.value=Math.abs(capex.value);
        capex.source.field+=" [outflow normalized to positive; original sign not an inference]";
        return {end,basis,currency:incCurrency,
          revenue:inc("totalRevenue"),grossProfit:inc("grossProfit"),operatingIncome:inc("operatingIncome"),netIncome:inc("netIncome"),
          operatingCF:cash("totalCashFromOperatingActivities"),investingCF:cash("totalCashflowsFromInvestingActivities"),
          financingCF:cash("totalCashFromFinancingActivities"),capex,sbc:cash("stockBasedCompensation"),
          cash:bal("cashAndEquivalents"),investments:bal("shortTermInvestments"),debt:bal("shortLongTermDebtTotal"),
          equity:bal("totalStockholderEquity"),assets:bal("totalAssets"),receivables:bal("netReceivables"),inventory:bal("inventory"),
          shares:bal("commonStockSharesOutstanding","shares")};
      });
    };
    const annual=normalizePeriods("annual"),quarterly=normalizePeriods("quarterly");
    const issues:CompanyData["issues"]=[];
    if (!annual.length || annual.length<3 || annual.slice(0,3).some(period=>period.revenue.value===null || period.operatingCF.value===null))
      issues.push({code:"FINANCIALS_UNAVAILABLE",message:"3年分以上の売上・営業CFが揃っていません。長期評価は保留します。"});
    let quote:CompanyData["quote"]=null;
    if (quoteResult.status==="fulfilled") {
      const row=record(quoteResult.value),timestamp=numberOrNull(row.timestamp),price=numberOrNull(row.close);
      const quoteAsOf=timestamp!==null && timestamp>0 && timestamp*1000<=this.now().getTime()+86400000?new Date(timestamp*1000).toISOString():null;
      if (row.code===candidate.symbol && price!==null && price>0 && quoteAsOf) {
        const priceSource={...source("real-time.close","instant",null,quoteCurrency,"per share",quoteAsOf),
          retrievedAt:this.fetchedAt.get("real-time/"+encodeURIComponent(candidate.symbol)+"?")??retrievedAt,
          url:"https://eodhd.com/financial-apis/live-ohlcv-stocks-api",title:"EODHD indicative / delayed price"};
        quote={price:{value:price,source:priceSource},previousClose:{value:numberOrNull(row.previousClose),source:{...priceSource,field:"real-time.previousClose",asOf:null}},delayed:true};
      }
    }
    if (!quote) issues.push({code:quoteResult.status==="rejected" && quoteResult.reason instanceof StockError?quoteResult.reason.code:"DATA_PROVIDER_ERROR",message:"株価を取得・照合できませんでした。リアルタイム価格を推測しません。"});
    const valuation=record(raw.Valuation),highlights=record(raw.Highlights);
    const reportedCurrency=record(financials.Income_Statement).currency_symbol;
    const reportingCurrency=typeof reportedCurrency==="string" && /^[A-Z]{3}$/.test(reportedCurrency)?reportedCurrency:null;
    const ratios={
      pe:datum(valuation.TrailingPE,"Valuation.TrailingPE","TTM",null,null,"倍"),
      pb:datum(valuation.PriceBookMRQ,"Valuation.PriceBookMRQ","instant",null,null,"倍"),
      evEbitda:datum(valuation.EnterpriseValueEbitda,"Valuation.EnterpriseValueEbitda","TTM",null,null,"倍"),
      ps:datum(valuation.PriceSalesTTM,"Valuation.PriceSalesTTM","TTM",null,null,"倍"),
      marketCap:datum(highlights.MarketCapitalization,"Highlights.MarketCapitalization (currency not documented)","instant",null,null),
      enterpriseValue:datum(valuation.EnterpriseValue,"Valuation.EnterpriseValue (reporting currency)","instant",null,reportingCurrency),
      ebitdaTTM:datum(highlights.EBITDA,"Highlights.EBITDA (TTM)","TTM",null,null),
      epsTTM:datum(highlights.DilutedEpsTTM??highlights.EarningsShare,"Highlights.EarningsShare (provider TTM)","TTM",null,null,"per share"),
    };
    // Loss-making/unknown EPS: PE is not usable; no "cheap because negative PE".
    if (ratios.epsTTM.value===null || ratios.epsTTM.value<=0 || ratios.pe.value===null || ratios.pe.value<=0) ratios.pe.value=null;
    if (annual[0]?.equity.value===null || !annual[0] || annual[0].equity.value!<=0 || (ratios.pb.value??0)<=0) ratios.pb.value=null;
    if ((ratios.evEbitda.value??0)<=0) ratios.evEbitda.value=null;
    if ((ratios.ps.value??0)<=0) ratios.ps.value=null;
    if (Object.values(ratios).slice(0,4).some(item=>item.value===null))
      issues.push({code:"VALUATION_UNAVAILABLE",message:"評価指標の一部が未取得、または比較条件未確認です。割安・割高の結論は保留します。"});
    let earnings:CompanyData["earnings"]=[];
    if (earningsResult.status==="fulfilled" && Array.isArray(record(earningsResult.value).earnings)) {
      earnings=(record(earningsResult.value).earnings as unknown[]).flatMap(item=>{
        const row=record(item),date=dateOrNull(row.report_date);
        if (!date || date<today || row.code!==candidate.symbol) return [];
        return [{date,period:dateOrNull(row.date),timing:textOrNull(row.before_after_market),source:{
          ...source("calendar.earnings.report_date","instant",dateOrNull(row.date),textOrNull(row.currency),"date",null),
          retrievedAt:this.fetchedAt.get("calendar/earnings?"+new URLSearchParams({symbols:candidate.symbol,from:today,to}).toString())??retrievedAt,
          url:"https://eodhd.com/financial-apis/calendar-upcoming-earnings-ipos-and-splits",
          title:"EODHD決算予定（予定変更あり・企業IRで要確認）"}}];
      }).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,2);
    }
    if (!earnings.length) issues.push({code:earningsResult.status==="rejected" && earningsResult.reason instanceof StockError?earningsResult.reason.code:"EARNINGS_UNAVAILABLE",message:"今後180日以内の決算予定日を確認できませんでした。予定日を推測しません。"});
    return {identity:{...candidate,name:String(general.Name),currency:quoteCurrency},
      description:textOrNull(general.Description),sector:textOrNull(general.Sector),industry:textOrNull(general.Industry),
      website:publicUrl(general.WebURL),cik:typeof general.CIK==="string" && /^\d{1,10}$/.test(general.CIK)?general.CIK:null,
      updatedAt,retrievedAt,annual,quarterly,quote,valuation:ratios,earnings,issues};
  }
}
