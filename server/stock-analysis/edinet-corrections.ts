import type { EdinetFiling } from "./edinet-xbrl";
import { normalizeEdinetXbrl } from "./edinet-xbrl";
import { StockError, type FinancialPeriod, type Source } from "./model";
const amended=(r:EdinetFiling)=>["130","150","170"].includes(r.docTypeCode);
const family=(r:EdinetFiling)=>({"130":"120","150":"140","170":"160"}[r.docTypeCode]??r.docTypeCode);
const fail=():never=>{throw new StockError("DATA_PROVIDER_ERROR","訂正書類の正式bindingがUNVERIFIEDです。訂正前の値を最新確定値として使用しません。");};
/** Resolve dates only from a disclosed same-issuer formal parent. Never assign a latest fiscal year. */
export function resolveCorrectionMetadata(rows:EdinetFiling[]):EdinetFiling[]{
  const byId=new Map(rows.map(r=>[r.docID,r]));
  const resolve=(r:EdinetFiling,seen=new Set<string>()):EdinetFiling=>{
    if(!amended(r))return r;
    if(seen.has(r.docID)||seen.size>=16)return fail();seen.add(r.docID);
    const parent=r.parentDocID?byId.get(r.parentDocID):undefined;
    if(!parent||parent.edinetCode!==r.edinetCode||parent.secCode!==r.secCode||family(parent)!==family(r)||
      parent.withdrawalStatus!=="0"||parent.disclosureStatus!=="0"||parent.submitDateTime>=r.submitDateTime)return fail();
    const bound=resolve(parent,seen);
    if(!bound.periodStart||!bound.periodEnd||(r.periodStart&&r.periodStart!==bound.periodStart)||(r.periodEnd&&r.periodEnd!==bound.periodEnd))return fail();
    return {...r,periodStart:bound.periodStart,periodEnd:bound.periodEnd};
  };
  return rows.map(r=>resolve(r));
}
function dei(xml:string,name:string):string|null{
  const ns=Object.fromEntries([...xml.matchAll(/xmlns:([\w.-]+)\s*=\s*(['"])(.*?)\2/g)].map(m=>[m[1],m[3]]));
  const found=[...xml.matchAll(new RegExp("<([\\w.-]+):"+name+"\\b([^>]*)>([^<]*)<\\/\\1:"+name+">","g"))]
    .filter(m=>/^https?:\/\/disclosure\.edinet-fsa\.go\.jp\/taxonomy\/jpdei\/\d{4}-\d{2}-\d{2}\/jpdei_cor$/.test(ns[m[1]]??"")&&/contextRef=["']FilingDateInstant["']/.test(m[2]));
  return found.length===1?found[0][3].trim():null;
}
const snapshot=(p:FinancialPeriod)=>Object.fromEntries(Object.entries(p).filter(([,v])=>v&&typeof v==="object"&&"value"in v).map(([k,v])=>[k,(v as {value:number|null}).value]));
/** Full correction XBRL is effective only after DEI + consolidated financial/unit binding. No per-field fallback. */
export function bindCorrectionXbrl(xml:string,row:EdinetFiling,parent:EdinetFiling,original:FinancialPeriod[],retrievedAt:string):FinancialPeriod[]{
  if(xml.length>12*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(xml))return fail();
  const ns=Object.fromEntries([...xml.matchAll(/xmlns:([\w.-]+)\s*=\s*(['"])(.*?)\2/g)].map(m=>[m[1],m[3]]));
  for(const m of xml.matchAll(/<(?:[\w.-]+:)?measure>([^<]*)<\/(?:[\w.-]+:)?measure>/g)){const [prefix,currency]=m[1].trim().split(":");if(/^[A-Z]{3}$/.test(currency??"")&&ns[prefix]!=="http://www.xbrl.org/2003/iso4217")return fail();}
  const filingContexts=[...xml.matchAll(/<(?:[\w.-]+:)?context\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?context>/g)].filter(m=>/id=["']FilingDateInstant["']/.test(m[1]));
  const get=(tag:string)=>new RegExp("<(?:[\\w.-]+:)?"+tag+"(?:\\s[^>]*)?>([^<]*)<\\/(?:[\\w.-]+:)?"+tag+">").exec(filingContexts[0]?.[2]??"")?.[1]?.trim();
  if(filingContexts.length!==1||get("identifier")!==row.edinetCode+"-000"||![row.submitDateTime.slice(0,10),parent.submitDateTime.slice(0,10),original[0]?.revenue.source.correction?.originalDocument.submittedAt.slice(0,10)].includes(get("instant")))return fail();
  const flags=[dei(xml,"ReportAmendmentFlagDEI"),dei(xml,"XBRLAmendmentFlagDEI")];
  if(!amended(row)||row.parentDocID!==parent.docID||row.edinetCode!==parent.edinetCode||row.secCode!==parent.secCode||
    family(row)!==family(parent)||row.submitDateTime<=parent.submitDateTime||
    dei(xml,"AmendmentFlagDEI")!=="true"||dei(xml,"IdentificationOfDocumentSubjectToAmendmentDEI")!==parent.docID||
    dei(xml,"EDINETCodeDEI")!==row.edinetCode||dei(xml,"SecurityCodeDEI")!==row.secCode||
    dei(xml,"WhetherConsolidatedFinancialStatementsArePreparedDEI")!=="true"||
    dei(xml,"CurrentFiscalYearStartDateDEI")!==row.periodStart||dei(xml,"CurrentPeriodEndDateDEI")!==row.periodEnd||
    flags.some(f=>!['true','false'].includes(f??''))||!flags.includes('true'))return fail();
  const periods=normalizeEdinetXbrl(xml,row,retrievedAt),current=periods.find(p=>p.end===row.periodEnd),prior=original.find(p=>p.end===row.periodEnd);
  if(!current||!prior||!current.currency||current.currency!==prior.currency||current.revenue.source.start!==prior.revenue.source.start||
    current.revenue.value===null||prior.revenue.value===null)return fail();
  const changed=Object.keys(snapshot(current)).filter(k=>snapshot(current)[k]!==snapshot(prior)[k]);
  if(flags[1]==='false'&&(changed.length||periods.some(p=>{const o=original.find(o=>o.end===p.end);return !o||p.currency!==o.currency||JSON.stringify(snapshot(p))!==JSON.stringify(snapshot(o));})))return fail();
  const document=(f:EdinetFiling)=>({docID:f.docID,edinetCode:f.edinetCode,secCode:f.secCode,docTypeCode:f.docTypeCode,periodStart:f.periodStart,periodEnd:f.periodEnd,submittedAt:f.submitDateTime});
  for(const p of periods){
    const previous=original.find(o=>o.end===p.end);
    const correction:NonNullable<Source['correction']>={originalDocument:document(parent),correctionDocument:document(row),
      xbrlFilingDate:get("instant")!,scope:flags[1]==='true'?'XBRL_RESTATED':'XBRL_UNCHANGED',consolidated:true,currency:p.currency,unit:'currency',
      originalValues:previous?snapshot(previous):{},changedFields:previous?Object.keys(snapshot(p)).filter(k=>snapshot(p)[k]!==snapshot(previous)[k]):[],
      previousCorrection:previous?.revenue.source.correction};
    for(const value of Object.values(p))if(value&&typeof value==='object'&&'source'in value)(value as {source:Source}).source.correction=correction;
  }
  return periods;
}
