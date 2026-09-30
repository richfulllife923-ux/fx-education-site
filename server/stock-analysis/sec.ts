import { PrimaryHttp } from "./primary-http";
import { emptyPeriod,emptyValuation,type FinancialField } from "./primary-model";
import { StockError,dateOrNull,numberOrNull,record,textOrNull,type Candidate,type CompanyData,type Datum,type FinancialPeriod,type Source,type StockProvider } from "./model";
const tags:Partial<Record<FinancialField,string[]>>={
  revenue:["RevenueFromContractWithCustomerExcludingAssessedTax","RevenueFromContractWithCustomerIncludingAssessedTax","Revenues","SalesRevenueNet"],
  grossProfit:["GrossProfit"],operatingIncome:["OperatingIncomeLoss"],netIncome:["NetIncomeLoss","ProfitLoss"],
  operatingCF:["NetCashProvidedByUsedInOperatingActivities"],investingCF:["NetCashProvidedByUsedInInvestingActivities"],
  financingCF:["NetCashProvidedByUsedInFinancingActivities"],capex:["PaymentsToAcquirePropertyPlantAndEquipment","PaymentsToAcquireProductiveAssets"],
  cash:["CashAndCashEquivalentsAtCarryingValue"],investments:["ShortTermInvestments"],
  debt:["DebtAndCapitalLeaseObligations"],equity:["StockholdersEquity","StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"],
  assets:["Assets"],liabilities:["Liabilities"],receivables:["AccountsReceivableNetCurrent","AccountsNotesAndOtherReceivablesNetCurrent"],
  inventory:["InventoryNet"],shares:["CommonStockSharesOutstanding"],sbc:["ShareBasedCompensation"],
  eps:["EarningsPerShareDiluted","EarningsPerShareBasic"],
};
const instant=new Set(["cash","investments","debt","equity","assets","liabilities","receivables","inventory","shares","currentDebt","noncurrentDebt"]);
type FactRow={start:string|null;end:string;value:number;filed:string;accn:string;form:string;tag:string;unit:string;priority:number};
export function secSource(cik:string,row:FactRow,retrievedAt:string,basis:Source["basis"]):Source {
  const clean=row.accn.replace(/-/g,"");
  return {provider:"SEC",url:"https://www.sec.gov/Archives/edgar/data/"+Number(cik)+"/"+clean+"/"+row.accn+"-index.html",
    title:"SEC EDGAR "+row.form+" / "+row.accn,classification:"FACT",retrievedAt,asOf:row.filed,filingDate:row.filed,
    field:"us-gaap:"+row.tag+" ["+row.unit+"]",basis,period:row.end,start:row.start,currency:row.unit==="shares"?null:row.unit.split("/")[0],
    unit:row.unit==="shares"?"shares":row.unit.includes("/")?"per share":"currency",form:row.form,accession:row.accn};
}
function rows(raw:Record<string,unknown>,names:string[],today:string):FactRow[] {
  const output:FactRow[]=[];
  names.forEach((tag,priority)=>{
    const units=record(record(raw[tag]).units);
    for(const [unit,values] of Object.entries(units)){
      if(!Array.isArray(values) || !/^(?:[A-Z]{3}(?:\/shares)?|shares)$/.test(unit))continue;
      for(const item of values){
        const row=record(item),end=dateOrNull(row.end),filed=dateOrNull(row.filed),value=numberOrNull(row.val),start=dateOrNull(row.start);
        if(!end || !filed || end>today || filed>today || value===null || !/^\d{10}-\d{2}-\d{6}$/.test(String(row.accn)) ||
          !["10-K","10-K/A","10-Q","10-Q/A"].includes(String(row.form)))continue;
        output.push({start,end,filed,value,accn:String(row.accn),form:String(row.form),tag,unit,priority});
      }
    }
  });
  return output;
}
export function normalizeSecFacts(raw:unknown,cik:string,retrievedAt:string,today:string):{annual:FinancialPeriod[];quarterly:FinancialPeriod[]} {
  const gaap=record(record(record(raw).facts)["us-gaap"]);
  const collected:Partial<Record<FinancialField|"currentDebt"|"noncurrentDebt",FactRow[]>>={};
  Object.entries(tags).forEach(([field,names])=>collected[field as FinancialField]=rows(gaap,names!,today));
  collected.currentDebt=rows(gaap,["DebtCurrent","LongTermDebtCurrent"],today);
  collected.noncurrentDebt=rows(gaap,["LongTermDebtNoncurrent"],today);
  const duration=(row:FactRow)=>row.start?(Date.parse(row.end)-Date.parse(row.start))/86400000+1:0;
  const normalize=(basis:"annual"|"quarterly"):FinancialPeriod[]=>{
    const revenueRows=(collected.revenue??[]).filter(row=>row.unit==="USD" && (basis==="annual"?
      row.form.startsWith("10-K") && duration(row)>=330 && duration(row)<=400:
      row.form.startsWith("10-Q") && duration(row)>=70 && duration(row)<=110));
    const sorted=revenueRows.sort((a,b)=>b.end.localeCompare(a.end)||b.filed.localeCompare(a.filed)||Number(b.form.endsWith("/A"))-Number(a.form.endsWith("/A"))||a.priority-b.priority);
    const anchors=[...new Map(sorted.map(row=>[row.end,row] as const).reverse()).values()]
      .sort((a,b)=>b.end.localeCompare(a.end)).slice(0,basis==="annual"?5:8);
    return anchors.map(anchor=>{
      const base=secSource(cik,anchor,retrievedAt,basis),period=emptyPeriod(anchor.end,basis,"USD",base);
      for(const [field,values] of Object.entries(collected)){
        const unit=field==="shares"?"shares":field==="eps"?"USD/shares":"USD";
        const eligible=values!.filter(row=>row.unit===unit && row.end===anchor.end &&
          (instant.has(field)?row.start===null:row.start===anchor.start) &&
          (basis==="annual"?row.form.startsWith("10-K"):row.form.startsWith("10-Q")));
        eligible.sort((a,b)=>b.filed.localeCompare(a.filed)||Number(b.form.endsWith("/A"))-Number(a.form.endsWith("/A"))||(a.accn===anchor.accn?-1:0)-(b.accn===anchor.accn?-1:0)||a.priority-b.priority);
        const picked=eligible[0];
        if(picked){
          const conflicting=eligible.some(row=>row.filed===picked.filed && row.form===picked.form && row.priority===picked.priority && row.value!==picked.value);
          (period as unknown as Record<string,Datum>)[field]={value:conflicting?null:field==="capex"?Math.abs(picked.value):picked.value,
            source:secSource(cik,picked,retrievedAt,basis)};
        }
      }
      return period;
    });
  };
  return {annual:normalize("annual"),quarterly:normalize("quarterly")};
}
export function secRequestHeaders(contactEmail:string|undefined):Record<string,string> {
  if(!contactEmail || contactEmail.length>320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
    throw new StockError("CONFIGURATION_REQUIRED","SEC_CONTACT_EMAILをサーバー環境に設定してください。");
  return {"User-Agent":"TUTTO Stock Analysis "+contactEmail,"Accept-Encoding":"gzip, deflate",Accept:"application/json"};
}
export class SecProvider implements StockProvider {
  private http:PrimaryHttp;
  private headers:Record<string,string>;
  constructor(contactEmail:string|undefined,fetcher:typeof fetch=fetch,private clock:()=>Date=()=>new Date(),interval=1100) {
    this.headers=secRequestHeaders(contactEmail);
    this.http=new PrimaryHttp(fetcher,interval,clock);
  }
  async search(query:string):Promise<Candidate[]> {
    const result=await this.http.json("https://www.sec.gov/files/company_tickers.json","sec-tickers",86400000,this.headers);
    return Object.values(record(result.data)).flatMap(item=>{
      const row=record(item),ticker=textOrNull(row.ticker)?.toUpperCase(),name=textOrNull(row.title),cik=numberOrNull(row.cik_str);
      if(!ticker || !name || !cik || !/^[A-Z0-9.-]{1,20}$/.test(ticker) || cik<=0 || !Number.isInteger(cik))return [];
      if(ticker!==query && !name.toUpperCase().includes(query))return [];
      return [{symbol:ticker+".US",code:ticker,exchange:"US" as const,name,country:"US",currency:null,cik:String(cik).padStart(10,"0")}];
    }).slice(0,20);
  }
  async company(candidate:Candidate):Promise<CompanyData> {
    const cik=candidate.cik;
    if(!cik || !/^\d{10}$/.test(cik))throw new StockError("DATA_PROVIDER_ERROR","SECの公式CIKを確認できませんでした。");
    const submissions=await this.http.json("https://data.sec.gov/submissions/CIK"+cik+".json","submissions."+cik,900000,this.headers);
    const sub=record(submissions.data);
    if(Number(sub.cik)!==Number(cik) || !Array.isArray(sub.tickers) || !sub.tickers.includes(candidate.code))
      throw new StockError("DATA_PROVIDER_ERROR","SECのCIK・Ticker対応が一致しません。");
    const recent=record(record(sub.filings).recent);
    const forms=Array.isArray(recent.form)?recent.form:[],accns=Array.isArray(recent.accessionNumber)?recent.accessionNumber:[],
      filingDates=Array.isArray(recent.filingDate)?recent.filingDate:[],reportDates=Array.isArray(recent.reportDate)?recent.reportDate:[];
    const relevant=forms.map((form,index)=>({form:String(form),accn:String(accns[index]),filed:dateOrNull(filingDates[index]),period:dateOrNull(reportDates[index])}))
      .filter((row):row is typeof row & {filed:string}=>["10-K","10-K/A","10-Q","10-Q/A"].includes(row.form) && !!row.filed && /^\d{10}-\d{2}-\d{6}$/.test(row.accn));
    const latest=relevant[0];
    const facts=await this.http.json("https://data.sec.gov/api/xbrl/companyfacts/CIK"+cik+".json","facts."+cik+"."+(latest?.accn??"unknown"),21600000,this.headers);
    if(Number(record(facts.data).cik)!==Number(cik))throw new StockError("DATA_PROVIDER_ERROR","CompanyfactsのCIKが一致しません。");
    const normalized=normalizeSecFacts(facts.data,cik,facts.retrievedAt,this.clock().toISOString().slice(0,10));
    const source:Source=latest?secSource(cik,{...latest,start:null,end:latest.period??"unknown",value:0,unit:"USD",priority:0,tag:"filings.recent"},submissions.retrievedAt,"instant"):
      {provider:"SEC",url:"https://www.sec.gov/edgar/browse/?CIK="+cik,title:"SEC EDGAR submissions",retrievedAt:submissions.retrievedAt,
        asOf:null,period:null,field:"submissions",basis:"instant",currency:null,unit:"metadata",classification:"FACT"};
    const issues:CompanyData["issues"]=[
      {code:"VALUATION_UNAVAILABLE",message:"FREE MODE：財務分析は利用可能、市場価格ベース指標は未接続です。VALUATION_STATUS = LIMITED。"},
      {code:"EARNINGS_UNAVAILABLE",message:"SECの提出済み資料から次回決算予定日を推測しません。企業IRで確認してください。"},
    ];
    if(normalized.annual.length<3)issues.push({code:"FINANCIALS_UNAVAILABLE",message:"比較可能な年次US-GAAP売上が3期未満です。独自拡張タグなどは未取得として扱います。"});
    return {provider:"SEC",mode:"FREE",valuationStatus:"LIMITED",primarySource:{...source,url:"https://data.sec.gov/submissions/CIK"+cik+".json",title:"SEC EDGAR submissions",field:"submissions.name / tickers / sicDescription",currency:null,unit:"metadata"},
      identity:{...candidate,name:textOrNull(sub.name)??candidate.name},description:null,sector:null,industry:textOrNull(sub.sicDescription),
      website:null,cik,updatedAt:latest?.filed??null,retrievedAt:facts.retrievedAt,...normalized,quote:null,
      valuation:emptyValuation(source),earnings:[],issues,
      filings:relevant.slice(0,12).map(row=>({url:"https://www.sec.gov/Archives/edgar/data/"+Number(cik)+"/"+row.accn.replace(/-/g,"")+"/"+row.accn+"-index.html",
        title:"SEC EDGAR "+row.form,filed:row.filed!,period:row.period,amended:row.form.endsWith("/A")}))};
  }
}
