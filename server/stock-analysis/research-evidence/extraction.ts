import type {CompanyData,Datum} from "../model";
import {freeCashFlow} from "../calculations";
import {readZip} from "../zip";
import {parserVersion} from "../top3-versions";
import {isoDate,type EvidenceBundle,type EvidenceDocument,type Fragment,type FactKind} from "./model";
export const extractionVersion=parserVersion+"/bounded-evidence/2";
type Block=Fragment&{companyId:string;period:string;contextRef:string};
const sections=new Map<string,string>([
 ["DescriptionOfBusinessTextBlock","事業の内容"],["BusinessRisksTextBlock","事業等のリスク"],
 ["ManagementAnalysisOfFinancialPositionOperatingResultsAndCashFlowsTextBlock","財政状態・経営成績・Cash Flowの分析"],
 ["NotesSegmentInformationConsolidatedFinancialStatementsIFRSTextBlock","セグメント情報"],
 ["NotesSegmentInformationConsolidatedFinancialStatementsTextBlock","セグメント情報"],
 ["ConsolidatedStatementOfCashFlowsIFRSTextBlock","連結Cash Flow計算書"],
 ["SupplementalCashFlowInformationIFRSTextBlock","Cash Flow補足情報"]
]);
function attrs(text:string){return Object.fromEntries([...text.matchAll(/([\w.:-]+)\s*=\s*(['"])([\s\S]*?)\2/g)].map(m=>[m[1],m[3]]));}
function element(text:string,name:string){return new RegExp("<(?:[\\w.-]+:)?"+name+"(?:\\s[^>]*)?>([^<]*)<\\/(?:[\\w.-]+:)?"+name+">").exec(text)?.[1]?.trim();}
function plainText(value:string):string{
 return value.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,"&")
 .replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,16384);
}
/** Official bounded TextBlocks are candidates only, never semantic classifications. */
export function extractBoundedSections(xml:string):Block[]{
 if(xml.length>12*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error("Unsupported bounded XBRL");
 const namespaces=Object.fromEntries([...xml.matchAll(/xmlns:([\w.-]+)\s*=\s*(['"])(.*?)\2/g)].map(m=>[m[1],m[3]]));
 const contexts=new Map<string,{companyId:string;period:string}>();
 for(const m of xml.matchAll(/<(?:[\w.-]+:)?context\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?context>/g)){
  const id=attrs(m[1]).id,issuer=element(m[2],"identifier"),end=element(m[2],"endDate")??element(m[2],"instant");
  if(id&&issuer&&/^E\d{5}(?:-\d{3})?$/.test(issuer)&&isoDate(end))contexts.set(id,{companyId:issuer.slice(0,6),period:end});
 }
 const blocks:Block[]=[];
 for(const m of xml.matchAll(/<([\w.-]+):([\w.-]+TextBlock)\b([^>]*)>([\s\S]*?)<\/\1:\2>/g)){
  if(!sections.has(m[2])||!/^https?:\/\/disclosure\.edinet-fsa\.go\.jp\/taxonomy\/(?:jpcrp|jppfs|jpigp)\//.test(namespaces[m[1]]??""))continue;
  const a=attrs(m[3]),ctx=contexts.get(a.contextRef);if(!ctx||a["xsi:nil"]==="true")continue;
  blocks.push({id:m[2]+"/"+a.contextRef+"/"+m.index,kind:null,text:plainText(m[4]),heading:sections.get(m[2])!,
   location:m[1]+":"+m[2]+" context="+a.contextRef+" offset="+m.index,structure:"TEXT_ONLY",confidence:"CONFIRMED",
   companyId:ctx.companyId,period:ctx.period,contextRef:a.contextRef});
  if(blocks.length>=16)break;
 }
 return blocks;
}
export class EvidenceCollector{
 private captured=new Map<string,{blocks:Block[];retrievedAt:string}>();
 /** Mirrors already requested EDINET ZIPs. Never issues a network request or alters the original response. */
 wrap(base:typeof fetch,clock:()=>Date=()=>new Date()):typeof fetch{
  return async(input,init)=>{
   const response=await base(input,init);
   try{
    const u=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url);
    const match=/^\/api\/v2\/documents\/(S[A-Z0-9]{7})$/.exec(u.pathname);
    if(response.ok&&u.protocol==="https:"&&u.hostname==="api.edinet-fsa.go.jp"&&match&&u.searchParams.get("type")==="1"){
     const clone=response.clone(),reader=clone.body?.getReader(),chunks:Uint8Array[]=[];let total=0;
     if(reader){for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;
       if(total>20*1024*1024){void reader.cancel().catch(()=>{});throw new Error("Bounded ZIP limit");}chunks.push(value);}
      const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
      const files=await readZip(bytes,name=>/^XBRL\/PublicDoc\/[^/]+\.xbrl$/i.test(name));
      if(files.length!==1)throw new Error("Ambiguous public XBRL");
      const blocks=extractBoundedSections(new TextDecoder("utf-8",{fatal:true}).decode(files[0].bytes));
      if(this.captured.size>=8)this.captured.delete(this.captured.keys().next().value!);
      this.captured.set(match[1],{blocks,retrievedAt:clock().toISOString()});
     }
    }
   }catch{/* Failure is missing candidate evidence; original financial provider remains authoritative. No URL/error logging. */}
   return response;
  };
 }
 bundle(company:CompanyData):EvidenceBundle{
  return bundleFromCompany(company,this.captured);
 }
}
export function bundleFromCompany(company:CompanyData,captured:Map<string,{blocks:Block[];retrievedAt:string}>=new Map()):EvidenceBundle{
 const latest=company.annual[0],documentId=latest?.revenue.source.accession??latest?.operatingCF.source.accession??"";
 const identity={companyId:company.identity.edinetCode??"",securityCode:company.identity.code,symbol:company.identity.symbol};
 const docs:EvidenceDocument[]=[];
 for(const filing of company.filings??[]){
  const id=(()=>{try{return new URL(filing.url).search.slice(1);}catch{return "";}})();
  if(!/^S[A-Z0-9]{7}$/.test(id)||!filing.period)continue;
  const raw=captured.get(id),document:EvidenceDocument={...identity,documentId:id,sourceType:"EDINET",url:filing.url,
   fiscalPeriod:filing.period,filingDate:filing.filed,retrievedAt:raw?.retrievedAt??company.retrievedAt,parserVersion:extractionVersion,fragments:[]};
  for(const block of raw?.blocks??[]){
   if(block.companyId===identity.companyId&&(block.period===filing.period ||
    (id===documentId&&block.contextRef==="FilingDateInstant"&&block.period===filing.filed)))
    document.fragments.push({id:id+"/"+block.id,kind:null,text:block.text,heading:block.heading,location:block.location,structure:"TEXT_ONLY",confidence:"CONFIRMED"});
  }
  docs.push(document);
 }
 for(const period of company.annual){
  const fcf=freeCashFlow(period);
  const add=(kind:FactKind,d:Datum)=>{
   if(d.value===null||d.source.provider!=="EDINET"||d.source.period!==period.end||d.source.basis!=="annual"||d.source.currency!==period.currency||d.source.unit!=="currency")return;
   const doc=docs.find(f=>f.documentId===d.source.accession);if(!doc)return;
   const start=d.source.start??period.operatingCF.source.start??period.revenue.source.start;
   if(!isoDate(start))return;
   doc.fragments.push({id:doc.documentId+"/"+period.end+"/"+kind,kind,
    fields:{value:d.value,period:period.end,start,basis:"annual",currency:d.source.currency,formula:kind==="FreeCashFlow"?fcf.formula:undefined},
    heading:kind==="FreeCashFlow"?"既存FCF計算":"連結財務諸表",location:(d.source.contextRef??"")+" / "+d.source.field,
    retrievedAt:d.source.retrievedAt,structure:"CANONICAL_FINANCIAL",confidence:"CONFIRMED"});
  };
  add("NetIncome",period.netIncome);add("OperatingCashFlow",period.operatingCF);add("Capex",period.capex);
  if(fcf.value!==null)add("FreeCashFlow",{value:fcf.value,source:fcf.source});
 }
 return {identity,latestAnnual:{documentId,fiscalPeriod:latest?.end??"",verified:company.provider==="EDINET"&&!!latest&&
 latest.basis==="annual"&&docs.some(d=>d.documentId===documentId&&d.fiscalPeriod===latest.end)},documents:docs};
}

