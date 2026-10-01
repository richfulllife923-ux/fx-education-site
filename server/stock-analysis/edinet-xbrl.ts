import { applyEdinetDebt, debtConcepts } from "./edinet-debt";
import { emptyPeriod,type FinancialField } from "./primary-model";
import { StockError,dateOrNull,numberOrNull,type FinancialPeriod,type Source } from "./model";
export type EdinetFiling={docID:string;edinetCode:string;secCode:string;filerName:string;docTypeCode:string;periodStart:string|null;periodEnd:string|null;
  submitDateTime:string;parentDocID:string|null;xbrlFlag:string;withdrawalStatus:string;disclosureStatus:string};
const mappings:Partial<Record<FinancialField,string[]>>={
  revenue:["RevenueIFRS","Revenue2IFRS","NetSales","Revenue","TotalNetRevenuesIFRS"],
  grossProfit:["GrossProfitIFRS","GrossProfit"],operatingIncome:["OperatingProfitLossIFRS","OperatingIncome","ProfitLossFromOperatingActivities"],
  netIncome:["ProfitLossAttributableToOwnersOfParentIFRS","ProfitLossIFRS","ProfitLossAttributableToOwnersOfParent","NetIncomeLoss","ProfitLoss"],
  operatingCF:["NetCashProvidedByUsedInOperatingActivitiesIFRS","NetCashProvidedByUsedInOperatingActivities","CashFlowsFromUsedInOperatingActivities"],
  investingCF:["NetCashProvidedByUsedInInvestingActivitiesIFRS","NetCashProvidedByUsedInInvestmentActivities","NetCashProvidedByUsedInInvestingActivities","CashFlowsFromUsedInInvestingActivities"],
  financingCF:["NetCashProvidedByUsedInFinancingActivitiesIFRS","NetCashProvidedByUsedInFinancingActivities","CashFlowsFromUsedInFinancingActivities"],
  capex:["PurchaseOfPropertyPlantAndEquipmentAndIntangibleAssetsInvCFIFRS","PurchaseOfPropertyPlantAndEquipmentInvCFIFRS","PurchaseOfPropertyPlantAndEquipmentInvCF","PurchaseOfPropertyPlantAndEquipment"],
  cash:["CashAndCashEquivalentsIFRS","CashAndDeposits","CashAndCashEquivalents"],
  debt:["InterestBearingLiabilitiesLiabilitiesIFRS","BondsAndBorrowingsLiabilitiesIFRS"],
  equity:["EquityAttributableToOwnersOfParentIFRS","EquityIFRS","NetAssets","Equity"],
  assets:["AssetsIFRS","TotalAssetsIFRS","Assets"],liabilities:["LiabilitiesIFRS","Liabilities"],
  inventory:["InventoriesIFRS","Inventories"],receivables:["TradeAndOtherReceivablesCAIFRS","NotesAndAccountsReceivableTrade","TradeAndOtherCurrentReceivables"],
  eps:["DilutedEarningsLossPerShareIFRS","BasicAndDilutedEarningsLossPerShareIFRS","DilutedEarningsPerShareIFRS","BasicEarningsLossPerShareIFRS","BasicEarningsPerShareIFRS","DilutedEarningsPerShare","BasicEarningsLossPerShare"],
};
// Reviewed against Toyota S100VWVY official Japanese/English label linkbases.
// Only this issuer/tag pair is allowed; names from unrelated custom namespaces remain UNKNOWN.
const reviewedExtensions:Record<string,string[]>={E02144:["TotalNetRevenuesIFRS"]};
const instant=new Set(["cash","debt","equity","assets","liabilities","inventory","receivables"]);
type Context={start:string|null;end:string;id:string;allowed:boolean};
type Fact={name:string;value:number|null;unit:string;unitRef:string;context:Context;prefix:string};
function attrs(text:string):Record<string,string> {
  const output:Record<string,string>={};
  for(const match of text.matchAll(/([\w.:-]+)\s*=\s*(['"])([\s\S]*?)\2/g))output[match[1]]=match[3];
  return output;
}
function tagText(xml:string,name:string):string|null {
  const result=new RegExp("<(?:[\\w.-]+:)?"+name+"(?:\\s[^>]*)?>([^<]*)<\\/(?:[\\w.-]+:)?"+name+">").exec(xml);
  return result?.[1]?.trim()??null;
}
export function edinetSource(filing:EdinetFiling,retrievedAt:string,basis:Source["basis"],period:string|null):Source {
  return {provider:"EDINET",url:"https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?"+filing.docID,
    title:"EDINET "+({"120":"有価証券報告書","130":"訂正有価証券報告書","140":"四半期報告書","150":"訂正四半期報告書","160":"半期報告書","170":"訂正半期報告書"}[filing.docTypeCode]??"提出書類")+" / "+filing.docID,
    retrievedAt,asOf:filing.submitDateTime.slice(0,10),filingDate:filing.submitDateTime.slice(0,10),classification:"FACT",
    field:"EDINET "+filing.docID,basis,period,start:filing.periodStart,currency:null,unit:"currency",form:filing.docTypeCode,accession:filing.docID};
}
export function normalizeEdinetXbrl(xml:string,filing:EdinetFiling,retrievedAt:string):FinancialPeriod[] {
  if(xml.length>12*1024*1024 || /<!DOCTYPE|<!ENTITY/i.test(xml))throw new StockError("DATA_PROVIDER_ERROR","未対応のXBRL宣言または容量です。");
  const namespaces:Record<string,string>={};
  const taxonomyUri=(uri:string)=>/^https?:\/\/disclosure\.edinet-fsa\.go\.jp\/taxonomy\/(?:jppfs|jpigp|jpcrp)\//.test(uri);
  for(const match of xml.matchAll(/xmlns:([\w.-]+)\s*=\s*(['"])(.*?)\2/g))namespaces[match[1]]=match[3];
  const contexts=new Map<string,Context>();
  for(const match of xml.matchAll(/<(?:[\w.-]+:)?context\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?context>/g)){
    const id=attrs(match[1]).id,body=match[2],start=dateOrNull(tagText(body,"startDate")),end=dateOrNull(tagText(body,"endDate")??tagText(body,"instant"));
    if(!id || !end || end>(filing.periodEnd??filing.submitDateTime.slice(0,10)))continue;
    const members=[...body.matchAll(/<(?:[\w.-]+:)?explicitMember\b([^>]*)>([^<]+)<\/(?:[\w.-]+:)?explicitMember>/g)].map(item=>({value:item[2].trim(),dimension:attrs(item[1]).dimension??""}));
    const allowed=new RegExp("^"+filing.edinetCode+"(?:-\\d{3})?$").test(tagText(body,"identifier")??"") && !/NonConsolidated|typedMember/i.test(body+" "+id) &&
      members.every(member=>member.value.split(":").pop()==="ConsolidatedMember" && member.dimension.split(":").pop()==="ConsolidatedOrNonConsolidatedAxis" && taxonomyUri(namespaces[member.value.split(":")[0]]??"") && taxonomyUri(namespaces[member.dimension.split(":")[0]]??""));
    contexts.set(id,{id,start,end,allowed});
  }
  if(![...contexts.values()].some(context=>context.allowed))throw new StockError("DATA_PROVIDER_ERROR","EDINET提出者と連結XBRL contextを照合できませんでした。");
  const units=new Map<string,string>();
  for(const match of xml.matchAll(/<(?:[\w.-]+:)?unit\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?unit>/g)){
    const id=attrs(match[1]).id,body=match[2],measures=[...body.matchAll(/<(?:[\w.-]+:)?measure>([^<]+)<\/(?:[\w.-]+:)?measure>/g)].map(item=>item[1].trim().split(":").pop()!);
    if(!id)continue;
    if(measures.length===1 && (/^[A-Z]{3}$/.test(measures[0]) || measures[0]==="shares"))units.set(id,measures[0]);
    if(/unitNumerator/.test(body) && measures.length===2 && /^[A-Z]{3}$/.test(measures[0]) && measures[1]==="shares")units.set(id,measures[0]+"/shares");
  }
  const facts:Fact[]=[];
  const whitelist=new Set([...Object.values(mappings).flat(),...debtConcepts]);
  for(const match of xml.matchAll(/<([\w.-]+):([\w.-]+)\b([^>]*)>([^<]*)<\/\1:\2>/g)){
    if(!whitelist.has(match[2]))continue;
    const uri=namespaces[match[1]]??"";
    const reviewed=reviewedExtensions[filing.edinetCode]?.includes(match[2]) && new RegExp("^https?://disclosure\\.edinet-fsa\\.go\\.jp/jpcrp\\d+/[^/]+/\\d+/"+filing.edinetCode+"-000/").test(uri);
    if(!reviewed && !/^https?:\/\/disclosure\.edinet-fsa\.go\.jp\/taxonomy\/(?:jppfs|jpigp)\//.test(uri) && !/^https?:\/\/(?:www\.)?xbrl\.ifrs\.org\/taxonomy\//.test(uri))continue;
    const attributes=attrs(match[3]),context=contexts.get(attributes.contextRef),unit=units.get(attributes.unitRef);
    if(!context?.allowed || !unit)continue;
    facts.push({name:match[2],prefix:match[1],value:attributes["xsi:nil"]==="true"?null:numberOrNull(match[4].trim()),context,unit,unitRef:attributes.unitRef});
  }
  const isAnnual=["120","130"].includes(filing.docTypeCode),isHalf=["160","170"].includes(filing.docTypeCode);
  const basis:FinancialPeriod["basis"]=isAnnual?"annual":isHalf?"half-year":"quarterly";
  const periods=[...new Map(facts.filter(fact=>fact.context.start && (isAnnual?
    (Date.parse(fact.context.end)-Date.parse(fact.context.start))/86400000>=329 && (Date.parse(fact.context.end)-Date.parse(fact.context.start))/86400000<=399:
    isHalf? fact.context.start===filing.periodStart && (Date.parse(fact.context.end)-Date.parse(fact.context.start))/86400000>=149 && (Date.parse(fact.context.end)-Date.parse(fact.context.start))/86400000<=209 : fact.context.start!>=(filing.periodStart??"") && (Date.parse(fact.context.end)-Date.parse(fact.context.start))/86400000>=69 && (Date.parse(fact.context.end)-Date.parse(fact.context.start))/86400000<=109))
    .map(fact=>[fact.context.end+"|"+fact.context.start,fact.context])).values()];
  return periods.map(context=>{
    const revenues=facts.filter(fact=>mappings.revenue!.includes(fact.name) && fact.context.end===context.end && fact.context.start===context.start);
    const currencies=[...new Set(revenues.map(fact=>fact.unit).filter(unit=>/^[A-Z]{3}$/.test(unit)))];
    const currency=currencies.length===1?currencies[0]:null;
    const period=emptyPeriod(context.end,basis,currency,{...edinetSource(filing,retrievedAt,basis,context.end),start:context.start});
    for(const [field,names] of Object.entries(mappings)){
      const unit=field==="eps"?currency+"/shares":currency;
      if(!unit)continue;
      const eligible=facts.filter(fact=>names.includes(fact.name) && fact.unit===unit && fact.context.end===context.end &&
        (instant.has(field)?fact.context.start===null:fact.context.start===context.start))
        .sort((a,b)=>names.indexOf(a.name)-names.indexOf(b.name));
      const found=eligible[0];if(!found)continue;
      const conflicts=eligible.some(fact=>fact.name===found.name && fact.value!==found.value);
      const value=conflicts?null:field==="capex" && found.value!==null?Math.abs(found.value):found.value;
      (period as unknown as Record<string,unknown>)[field]={value,source:{...edinetSource(filing,retrievedAt,basis,context.end),
        field:found.prefix+":"+found.name+" / context="+found.context.id,contextRef:found.context.id,start:found.context.start,
        currency,unit:field==="eps"?"per share":"currency"}};
    }
    applyEdinetDebt(xml,filing,period,facts);
    return period;
  }).sort((a,b)=>b.end.localeCompare(a.end));
}
