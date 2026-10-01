import { resolveCorrectionMetadata, bindCorrectionXbrl } from "./edinet-corrections";
import issuers from "./edinet-issuers.json";
import bundledIndex from "./edinet-filings.json";
import { PrimaryHttp } from "./primary-http";
import { readZip } from "./zip";
import { emptyValuation } from "./primary-model";
import { edinetSource,normalizeEdinetXbrl,type EdinetFiling } from "./edinet-xbrl";
import { StockError,dateOrNull,record,textOrNull,type Candidate,type CompanyData,type FinancialPeriod,type StockProvider } from "./model";
export type EdinetIndex={version:number;coveredThrough:string|null;retrievedAt:string|null;filings:EdinetFiling[];historyStart?:string|null};
const types=["120","130","140","150","160","170"];
const day=(date:Date)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
const next=(date:string)=>new Date(Date.parse(date)+86400000).toISOString().slice(0,10);
export function parseEdinetRow(raw:unknown):EdinetFiling|null {
  const row=record(raw),docID=textOrNull(row.docID),edinetCode=textOrNull(row.edinetCode),secCode=textOrNull(row.secCode);
  if(!docID || !/^S[0-9A-Z]{7}$/.test(docID) || !edinetCode || !/^E\d{5}$/.test(edinetCode) ||
    !secCode || !/^[1-9][0-9]{2}[A-Z0-9]0$/.test(secCode) || !types.includes(String(row.docTypeCode)))return null;
  const submitted=textOrNull(row.submitDateTime);
  if(!submitted || !dateOrNull(submitted.slice(0,10)))return null;
  return {docID,edinetCode,secCode,filerName:textOrNull(row.filerName)??"",docTypeCode:String(row.docTypeCode),
    periodStart:dateOrNull(row.periodStart),periodEnd:dateOrNull(row.periodEnd),submitDateTime:submitted,
    parentDocID:textOrNull(row.parentDocID),xbrlFlag:String(row.xbrlFlag),withdrawalStatus:String(row.withdrawalStatus),disclosureStatus:String(row.disclosureStatus)};
}
export function mergeEdinetRows(previous:EdinetFiling[],updates:unknown[]):EdinetFiling[] {
  const rows=new Map(previous.map(row=>[row.docID,row]));
  for(const raw of updates){
    const docID=textOrNull(record(raw).docID);if(!docID)continue;
    // Null metadata can indicate expired disclosure: remove stale indexed records, too.
    rows.delete(docID);const row=parseEdinetRow(raw);if(row)rows.set(docID,row);
  }
  return [...rows.values()];
}
export function isDisclosed(row:EdinetFiling):boolean {
  return row.withdrawalStatus==="0" && row.disclosureStatus==="0";
}
export class EdinetProvider implements StockProvider {
  private http:PrimaryHttp;
  private parsed=new Map<string,{retrievedAt:string;periods:FinancialPeriod[]}>();
  constructor(private key:string|undefined,private index:EdinetIndex=bundledIndex as EdinetIndex,
    fetcher:typeof fetch=fetch,private clock:()=>Date=()=>new Date(),interval=1100) {this.http=new PrimaryHttp(fetcher,interval,clock);}
  async search(query:string):Promise<Candidate[]> {
    return issuers.issuers.filter(row=>row.code===query || row.name.toUpperCase().includes(query) || row.englishName.toUpperCase().includes(query))
      .slice(0,20).map(row=>({symbol:row.code+".JP",code:row.code,exchange:"JP",name:row.name,country:"JP",currency:null,edinetCode:row.edinetCode}));
  }
  private async list(date:string):Promise<{data:unknown[];retrievedAt:string}> {
    const result=await this.http.json("https://api.edinet-fsa.go.jp/api/v2/documents.json?date="+date+"&type=2&Subscription-Key="+encodeURIComponent(this.key!),
      "edinet-list."+date,900000);
    const data=record(result.data),metadata=record(data.metadata);
    if(String(metadata.status)!=="200" || !Array.isArray(data.results))throw new StockError("DATA_PROVIDER_ERROR","EDINETの書類一覧・応答状態を確認できませんでした。");
    return {data:data.results,retrievedAt:result.retrievedAt};
  }
  async company(candidate:Candidate):Promise<CompanyData> {
    if(!this.key?.trim())throw new StockError("CONFIGURATION_REQUIRED","日本株の分析にはサーバー専用のEDINET_API_KEY設定が必要です。秘密鍵をチャットへ送らないでください。");
    const identity=issuers.issuers.find(row=>row.code===candidate.code && row.edinetCode===candidate.edinetCode);
    if(!identity)throw new StockError("DATA_PROVIDER_ERROR","EDINETの公式提出者・証券コード対応が一致しません。");
    const today=day(this.clock()),covered=dateOrNull(this.index.coveredThrough);
    if(this.index.version!==1 || !covered || covered>today || Date.parse(today)-Date.parse(covered)>7*86400000)
      throw new StockError("CONFIGURATION_REQUIRED","EDINET提出書類の索引を更新してください。管理者用refresh-edinet-filingsスクリプトで公式APIから取得します。");
    let indexed=this.index.filings.filter(row=>row.edinetCode===identity.edinetCode);
    // Include current date even when covered: filings and corrections can arrive during the day.
    for(let date=covered;date<=today;date=next(date)){
      const update=await this.list(date);indexed=mergeEdinetRows(indexed,update.data).filter(row=>row.edinetCode===identity.edinetCode);
    }
    const resolved=resolveCorrectionMetadata(indexed.filter(isDisclosed).filter(row=>row.submitDateTime.slice(0,10)<=today));
    const ordered=resolved.filter(isDisclosed).filter(row=>row.periodEnd && row.periodEnd<=today && row.submitDateTime.slice(0,10)<=today).sort((a,b)=>b.periodEnd!.localeCompare(a.periodEnd!)||b.submitDateTime.localeCompare(a.submitDateTime));
    const selected:EdinetFiling[]=[];
    for(const row of ordered){
      const group=["120","130"].includes(row.docTypeCode)?"annual":["160","170"].includes(row.docTypeCode)?"half":"quarter";
      const existing=selected.filter(item=>(["120","130"].includes(item.docTypeCode)?"annual":["160","170"].includes(item.docTypeCode)?"half":"quarter")===group);
      if(existing.some(item=>item.periodEnd===row.periodEnd))continue;
      if(existing.length<(group==="annual"?4:1))selected.push(row);
    }
    if(!selected.length)throw new StockError("FINANCIALS_UNAVAILABLE","対象企業の有価証券報告書・半期報告書を公式索引で確認できませんでした。");
    const issues:CompanyData["issues"]=[{code:"VALUATION_UNAVAILABLE",message:"FREE MODE：財務分析は利用可能、市場価格ベース指標は未接続です。VALUATION_STATUS = LIMITED。"},
      {code:"EARNINGS_UNAVAILABLE",message:"提出済み報告書から次回決算予定日を推測しません。企業IRで確認してください。"}];
    const verified=new Map<string,EdinetFiling>();
    const verify=async (original:EdinetFiling):Promise<EdinetFiling>=>{
      if(verified.has(original.docID))return verified.get(original.docID)!;
      const checked=await this.list(original.submitDateTime.slice(0,10));
      const raw=checked.data.map(parseEdinetRow).find(item=>item?.docID===original.docID);
      if(!raw||raw.edinetCode!==identity.edinetCode||raw.secCode!==identity.code+"0"||!isDisclosed(raw))
        throw new StockError("DATA_PROVIDER_ERROR","訂正関係・最新書類の開示状態がUNVERIFIEDです。旧値へ代用しません。");
      const bound=resolveCorrectionMetadata([...indexed.filter(r=>r.docID!==raw.docID),raw]).find(r=>r.docID===raw.docID)!;
      if(bound.periodStart!==original.periodStart||bound.periodEnd!==original.periodEnd||bound.docTypeCode!==original.docTypeCode||bound.parentDocID!==original.parentDocID||bound.submitDateTime!==original.submitDateTime)
        throw new StockError("DATA_PROVIDER_ERROR","選択後に書類metadataが変更されました。旧値へ代用しません。");
      verified.set(bound.docID,bound);return bound;
    };
    const load=async (candidate:EdinetFiling):Promise<{retrievedAt:string;periods:FinancialPeriod[]}>=>{
      const row=await verify(candidate),cacheKey=[row.docID,row.periodStart,row.periodEnd,row.docTypeCode,row.edinetCode].join("|");
      // Revalidate all ancestors even when a correction's normalized facts are cached.
      const parent=["130","150","170"].includes(row.docTypeCode)?resolved.find(r=>r.docID===row.parentDocID):undefined;
      const base=parent?await load(parent):undefined;
      let cached=this.parsed.get(cacheKey);if(cached)return cached;
      if(row.xbrlFlag!=="1")throw new StockError("FINANCIALS_UNAVAILABLE","最新書類にXBRLがありません。旧値へ代用しません。");
      const zip=await this.http.get("https://api.edinet-fsa.go.jp/api/v2/documents/"+row.docID+"?type=1&Subscription-Key="+encodeURIComponent(this.key!),"edinet-xbrl."+cacheKey,7*86400000);
      const entries=await readZip(zip.bytes,name=>/^XBRL\/PublicDoc\/[^/]+\.xbrl$/i.test(name));
      if(entries.length!==1)throw new StockError("FINANCIALS_UNAVAILABLE","連結XBRL本文を一意に選べませんでした。");
      const xml=new TextDecoder("utf-8",{fatal:true}).decode(entries[0].bytes);
      cached={retrievedAt:zip.retrievedAt,periods:parent&&base?bindCorrectionXbrl(xml,row,parent,base.periods,zip.retrievedAt):normalizeEdinetXbrl(xml,row,zip.retrievedAt)};
      if(this.parsed.size>=8)this.parsed.delete(this.parsed.keys().next().value!);this.parsed.set(cacheKey,cached);return cached;
    };
    const periods:FinancialPeriod[]=[],filings:NonNullable<CompanyData["filings"]>=[];
    let retrievedAt=this.clock().toISOString(),verifiedLatest:EdinetFiling|undefined;
    // Recheck each selected document's submission-day metadata to catch withdrawal/header edits in older lists.
    for(const original of selected){
      const row=await verify(original);
      retrievedAt=this.clock().toISOString();
      if(!verifiedLatest || row.submitDateTime>verifiedLatest.submitDateTime)verifiedLatest=row;
      const source=edinetSource(row,retrievedAt,"instant",row.periodEnd);
      filings.push({url:source.url,title:source.title,filed:row.submitDateTime.slice(0,10),period:row.periodEnd,amended:["130","150","170"].includes(row.docTypeCode)});
      if(row.xbrlFlag!=="1"){
        issues.push({code:"FINANCIALS_UNAVAILABLE",message:row.docID+"にXBRLがありません。訂正前の数値で代用しません。"});continue;
      }
      try{
        const cached=await load(row);
        for(let parentID=row.parentDocID;parentID;){const parent=verified.get(parentID);if(!parent)break;const originalSource=edinetSource(parent,cached.retrievedAt,"instant",parent.periodEnd);if(!filings.some(f=>f.url===originalSource.url))filings.push({url:originalSource.url,title:originalSource.title,filed:parent.submitDateTime.slice(0,10),period:parent.periodEnd,amended:["130","150","170"].includes(parent.docTypeCode)});parentID=parent.parentDocID;}
        periods.push(...cached.periods);
      }catch(error){
        if(["130","150","170"].includes(row.docTypeCode))throw new StockError("DATA_PROVIDER_ERROR","訂正書類 "+row.docID+" のbindingがUNVERIFIEDです。訂正前の値へ代用しません。");
        if(error instanceof StockError && ["RATE_LIMITED","CONFIGURATION_REQUIRED"].includes(error.code))throw error;
        issues.push({code:"FINANCIALS_UNAVAILABLE",message:row.docID+"のXBRLを安全に正規化できませんでした。数値は未取得です。"});
      }
    }
    const deduplicate=(basis:FinancialPeriod["basis"])=>[...new Map(periods.filter(period=>period.basis===basis)
      .sort((a,b)=>(b.revenue.source.filingDate??"").localeCompare(a.revenue.source.filingDate??""))
      .map(period=>[period.end,period] as const).reverse()).values()].sort((a,b)=>b.end.localeCompare(a.end)).slice(0,5);
    // A selected correction without complete XBRL blocks older comparative values for that fiscal end.
    const blocked=new Set(selected.filter(row=>["120","130"].includes(row.docTypeCode) && !periods.some(period=>period.end===row.periodEnd && period.revenue.source.accession===row.docID)).map(row=>row.periodEnd));
    const annual=deduplicate("annual").filter(period=>!blocked.has(period.end));
    // Metadata chooses the latest formal annual period; a failed download/parse must not promote older data.
    // An empty annual set still means unavailable. Existing partial/UNKNOWN and amendment handling stay intact.
    const latestAnnual=selected.find(row=>["120","130"].includes(row.docTypeCode));
    if(latestAnnual && annual.length && annual[0].end!==latestAnnual.periodEnd)
      throw new StockError("DATA_PROVIDER_ERROR","最新の有価証券報告書（"+latestAnnual.docID+" / "+latestAnnual.periodEnd+"）を取得・確認できないため、旧年度を最新として分析しません。一次資料の取得状況を確認して再試行してください。");
    if(annual.filter(period=>period.revenue.value!==null && period.currency).length<3)issues.push({code:"FINANCIALS_UNAVAILABLE",message:"比較可能な連結年次データが3期未満です。標準タグで取得できない独自拡張項目はUNKNOWNです。"});
    const primary=
      {provider:"EDINET",url:issuers.sourceUrl,title:"EDINETコードリスト",retrievedAt:issuers.retrievedAt,asOf:issuers.asOf,
        field:"EDINET issuer list",basis:"instant" as const,period:null,currency:null,unit:"metadata",classification:"FACT" as const};
    return {provider:"EDINET",mode:"FREE",valuationStatus:"LIMITED",primarySource:primary,
      identity:{...candidate,name:identity.name},description:null,sector:null,industry:identity.industry,website:null,cik:null,
      updatedAt:verifiedLatest?.submitDateTime.slice(0,10)??null,retrievedAt,annual,quarterly:deduplicate("quarterly").filter(period=>!blocked.has(period.end)),
      semiAnnual:deduplicate("half-year").filter(period=>!blocked.has(period.end)),quote:null,valuation:emptyValuation(primary),earnings:[],issues,filings};
  }
}
