import type { DebtComponent, DebtEvidence } from "../../lib/stock-debt";
import type { Datum, FinancialPeriod, Source } from "./model";
import { dateOrNull } from "./model";
import type { EdinetFiling } from "./edinet-xbrl";

// Reviewed D1-D3 concepts. Whitelisting only makes a fact eligible for the checks below.
export const debtConcepts = ["InterestBearingLiabilitiesCLIFRS","InterestBearingLiabilitiesNCLIFRS",
  "BondsAndBorrowingsCLIFRS","BondsAndBorrowingsNCLIFRS","LeaseLiabilitiesCLIFRS","LeaseLiabilitiesNCLIFRS",
  "ShortTermLoansPayable","CurrentPortionOfLongTermLoansPayable","LongTermLoansPayable","CurrentPortionOfBonds","BondsPayable","LeaseObligationsCL","LeaseObligationsNCL"];
export type DebtFact = {name:string;prefix:string;value:number|null;unit:string;unitRef:string;context:{id:string;start:string|null;end:string}};
type Note = {name:string;contextRef:string;html:string;text:string};
type Cell = {text:string};
const compact=(s:string)=>s.normalize("NFKC").replace(/\s+/g,"").trim();
const attributes=(s:string)=>Object.fromEntries([...s.matchAll(/([\w.:-]+)\s*=\s*(['"])([\s\S]*?)\2/g)].map(m=>[m[1],m[3]]));
function decode(s:string):string {
  return s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'")
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{const n=parseInt(h??d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):"\ufffd";})
    .replace(/&amp;/g,"&");
}
const text=(html:string)=>decode(html.replace(/<[^>]*>/g," ")).normalize("NFKC").replace(/\s+/g," ").trim();
const official=(uri:string)=>/^https?:\/\/disclosure\.edinet-fsa\.go\.jp\/taxonomy\/(?:jpigp|jppfs|jpcrp)\//.test(uri);
const standardFinancial=(uri:string)=>/^https?:\/\/disclosure\.edinet-fsa\.go\.jp\/taxonomy\/jpigp\/\d{4}-\d{2}-\d{2}\/jpigp_cor$/.test(uri);
function namespaces(xml:string):Record<string,string>{return Object.fromEntries([...xml.matchAll(/xmlns:([\w.-]+)\s*=\s*(['"])(.*?)\2/g)].map(m=>[m[1],m[3]]));}
function note(xml:string,name:string,filing:EdinetFiling,ns:Record<string,string>,filingDate=false):Note|null {
  const matches=[...xml.matchAll(new RegExp("<([\\w.-]+):("+name+")\\b([^>]*)>([^<]*)<\\/\\1:\\2>","g"))];
  const found=matches.filter(m=>{
    const a=attributes(m[3]),uri=ns[m[1]]??"";
    const issuerExtension=new RegExp("^https?://disclosure\\.edinet-fsa\\.go\\.jp/jpcrp\\d+/asr/\\d+/"+filing.edinetCode+"-000/"+filing.periodEnd+"/\\d+/"+filing.submitDateTime.slice(0,10)+"$").test(uri);
    const validNoteNamespace=["AnnexedConsolidatedDetailedScheduleOfBorrowingsTextBlock","AnnexedConsolidatedDetailedScheduleOfCorporateBondsTextBlock","ConsolidatedBalanceSheetTextBlock"].includes(name)?/^https?:\/\/disclosure\.edinet-fsa\.go\.jp\/taxonomy\/(?:jpcrp|jppfs)\/\d{4}-\d{2}-\d{2}\/(?:jpcrp|jppfs)_cor$/.test(uri):name==="NotesBorrowingsAndOtherFinancialLiabilitiesConsolidatedFinancialStatementsIFRSTextBlock"?issuerExtension:name==="ManagementAnalysisOfFinancialPositionOperatingResultsAndCashFlowsTextBlock"?/^https?:\/\/disclosure\.edinet-fsa\.go\.jp\/taxonomy\/jpcrp\/\d{4}-\d{2}-\d{2}\/jpcrp_cor$/.test(uri):standardFinancial(uri);
    if(!validNoteNamespace)return false;
    const expected=filingDate?"FilingDateInstant":"CurrentYearDuration";
    if(a.contextRef!==expected)return false;
    const context=[...xml.matchAll(/<(?:[\w.-]+:)?context\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?context>/g)].filter(c=>attributes(c[1]).id===expected);
    if(context.length!==1)return false;
    const body=context[0][2],get=(tag:string)=>new RegExp("<(?:[\\w.-]+:)?"+tag+"(?:\\s[^>]*)?>([^<]*)<\\/(?:[\\w.-]+:)?"+tag+">").exec(body)?.[1]?.trim();
    if(get("identifier")!==filing.edinetCode+"-000" || /NonConsolidated|typedMember/i.test(body))return false;
    const members=[...body.matchAll(/<(?:[\w.-]+:)?explicitMember\b([^>]*)>([^<]+)<\/(?:[\w.-]+:)?explicitMember>/g)];
    if(members.some(m=>m[2].trim().split(":").pop()!=="ConsolidatedMember" || attributes(m[1]).dimension?.split(":").pop()!=="ConsolidatedOrNonConsolidatedAxis" || !official(ns[m[2].trim().split(":")[0]]??"") || !official(ns[attributes(m[1]).dimension?.split(":")[0]]??"")))return false;
    return filingDate?dateOrNull(get("instant"))===filing.submitDateTime.slice(0,10):dateOrNull(get("startDate"))===filing.periodStart&&dateOrNull(get("endDate"))===filing.periodEnd;
  });
  if(found.length!==1 || found[0][4].length>1000000)return null;
  const m=found[0],html=decode(m[4]);return {name:m[1]+":"+name,contextRef:attributes(m[3]).contextRef,html,text:text(html)};
}
/** Bounded, reviewed table contract. Expand spans so the dated header selects the exact column. */
function tables(n:Note):Cell[][][] {
  const result:Cell[][][]=[];
  for(const match of n.html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)){
    if(result.length>=128 || /<table\b|<script\b|<style\b/i.test(match[1]))continue;
    const grid:Cell[][]=[];let invalid=false,rowIndex=0;
    for(const row of match[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
      if(rowIndex>=1000){invalid=true;break;}grid[rowIndex]??=[];let column=0;
      for(const m of row[1].matchAll(/<t[dh]\b([^>]*)>([\s\S]*?)<\/t[dh]>/gi)){
        while(grid[rowIndex][column])column++;
        const a=attributes(m[1]),width=Number(a.colspan??1),height=Number(a.rowspan??1),cell={text:text(m[2])};
        if(!Number.isInteger(width)||width<1||width>24||!Number.isInteger(height)||height<1||height>8||column+width>32){invalid=true;break;}
        for(let y=0;y<height;y++)for(let x=0;x<width;x++){
          grid[rowIndex+y]??=[];if(grid[rowIndex+y][column+x])invalid=true;grid[rowIndex+y][column+x]=cell;
        }
        column+=width;
      }
      rowIndex++;if(invalid)break;
    }
    if(!invalid&&grid.length)result.push(grid);
  }
  return result;
}
function fiscalColumn(rows:Cell[][],fiscalDate:string):number|null {
  const [year,month,day]=fiscalDate.split("-").map(Number),date=year+"年"+month+"月"+day+"日";
  const cols=new Set<number>();
  rows.forEach(row=>row.forEach((cell,i)=>{const dates=[...compact(cell.text).matchAll(/\d{4}年\d{1,2}月\d{1,2}日/g)];if(dates.length===1&&dates[0][0]===date)cols.add(i);}));
  return cols.size===1?[...cols][0]:null;
}
const millions=(s:string|undefined):number|null=>{
  const raw=compact(s??"");if(!/^-?(?:\d{1,3}(?:,\d{3})+|\d+)$/.test(raw))return null;
  const value=Number(raw.replace(/,/g,""))*1000000;return Number.isSafeInteger(value)?value:null;
};
function tableValue(n:Note|null,label:string,fiscalDate:string,scope?:string,maturity?:string):number|null {
  if(!n)return null;const values:(number|null)[]=[];
  for(const rows of tables(n)){
    const all=compact(rows.flatMap(r=>r.map(c=>c?.text??"")).join(" "));
    if(!/(?:単位|金額):百万円/.test(all))continue;
    const column=fiscalColumn(rows,fiscalDate);if(column===null)continue;
    let selectedScope="",selectedMaturity="";
    for(const row of rows){
      const first=compact(row[0]?.text??"");
      if(first==="(自動車等)"||first==="(金融)"){selectedScope=first;selectedMaturity="";}
      if(first.startsWith("(消去)")||first.startsWith("(連結)")){selectedScope="";selectedMaturity="";}
      if(first==="流動負債"||first==="非流動負債")selectedMaturity=first;
      if(first===compact(label)&&(!scope||selectedScope===scope)&&(!maturity||selectedMaturity===maturity))values.push(millions(row[column]?.text));
    }
  }
  return values.length===1?values[0]:null;
}
function component(name:string,fact:DebtFact|undefined,p:FinancialPeriod,s:Source):DebtComponent {
  return {name,value:fact?.value??null,fiscalDate:p.end,currency:p.currency,
    sourceField:fact?fact.prefix+":"+fact.name+" / context="+fact.context.id:"unavailable."+name,contextRef:fact?.context.id??"CurrentYearInstant",sourceUrl:s.url};
}
function datum(c:DebtComponent,s:Source):Datum {
  return {value:c.value,source:{...s,field:c.sourceField,contextRef:c.contextRef,period:c.fiscalDate,start:null,currency:c.currency,unit:"currency"}};
}
function supplement(n:Note|null,p:FinancialPeriod,s:Source):DebtEvidence["supplemental"] {
  if(!n||!n.text.includes("自動車等セグメントと金融セグメントを区分した連結財政状態計算書")||!n.text.includes("消去"))return [];
  const output:DebtEvidence["supplemental"]=[];
  for(const [group,label,scope]of [["(金融)","金融事業","FINANCIAL_BUSINESS"],["(自動車等)","自動車等","NON_FINANCIAL_BUSINESS"]] as const){
    const current=tableValue(n,"有利子負債",p.end,group,"流動負債"),noncurrent=tableValue(n,"有利子負債",p.end,group,"非流動負債");
    if(current===null||noncurrent===null)continue;
    const make=(value:number,maturity:string):DebtComponent=>({name:label+" / "+maturity,value,fiscalDate:p.end,currency:p.currency,sourceField:n.name+" / "+group+" / "+maturity+" / 有利子負債",contextRef:n.contextRef,sourceUrl:s.url});
    output.push({label,scope,role:"SUPPLEMENTAL",current:make(current,"流動負債"),noncurrent:make(noncurrent,"非流動負債")});
  }
  return output;
}
/** Issuer-reviewed D1-D3 application. Financial values outside Debt are never modified. */
export function applyEdinetDebt(xml:string,filing:EdinetFiling,p:FinancialPeriod,facts:DebtFact[]):void {
  if(applyJapanGaapSingleBorrowing(xml,filing,p,facts))return;
  if(p.basis!=="annual"||p.end!==filing.periodEnd||!filing.periodStart||!dateOrNull(p.end)||!["E02144","E35948"].includes(filing.edinetCode))return;
  const ns=namespaces(xml),s={...p.debt.source,period:p.end,start:null,currency:p.currency};
  const yenUnits=new Set<string>();
  for(const u of xml.matchAll(/<(?:[\w.-]+:)?unit\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?unit>/g)){
    const measures=[...u[2].matchAll(/<(?:[\w.-]+:)?measure>([^<]*)<\/(?:[\w.-]+:)?measure>/g)];
    const measure=measures[0]?.[1].trim().split(":");
    if(measures.length===1&&!/divide|unitNumerator|unitDenominator/.test(u[2])&&measure?.length===2&&measure[1]==="JPY"&&ns[measure[0]]==="http://www.xbrl.org/2003/iso4217")yenUnits.add(attributes(u[1]).id);
  }
  const pick=(names:string[]):DebtFact|undefined=>{
    const eligible=facts.filter(f=>names.includes(f.name)&&f.context.id==="CurrentYearInstant"&&f.context.start===null&&f.context.end===p.end&&f.unit==="JPY"&&yenUnits.has(f.unitRef)&&p.currency==="JPY"&&standardFinancial(ns[f.prefix]??""));
    return eligible.length===1&&eligible[0].value!==null&&Number.isSafeInteger(eligible[0].value)?eligible[0]:undefined;
  };
  const totalNames=["InterestBearingLiabilitiesLiabilitiesIFRS","BondsAndBorrowingsLiabilitiesIFRS"],declared=pick(totalNames);
  const hasDeclared=facts.some(f=>totalNames.includes(f.name)&&f.context.id==="CurrentYearInstant"&&f.context.start===null&&f.context.end===p.end);
  const checks:DebtEvidence["checks"]=[],add=(id:string,passed:boolean,detail:string,sourceField?:string)=>checks.push({id,passed,detail,sourceField});
  const primary=(value:number|null,sourceType:DebtEvidence["sourceType"],sourceField:string,components:DebtComponent[],validationFormula?:string,validationValue?:number|null,supplemental:DebtEvidence["supplemental"]=[])=>{
    const confirmed=value!==null&&checks.every(c=>c.passed);
    p.debt={value:confirmed?value:null,source:{...s,field:sourceField,contextRef:sourceType==="SOURCE_DECLARED_TOTAL"?(declared?.context.id??"CurrentYearDuration"):"CurrentYearInstant"},
      sourceType:confirmed?sourceType:components.some(c=>c.value!==null)?"UNVERIFIED":"UNAVAILABLE",sourceField,fiscalDate:p.end,currency:p.currency,scope:"CONSOLIDATED",confidence:confirmed?"CONFIRMED":"UNVERIFIED",
      components,checks,doubleCount:confirmed?"NO":"UNVERIFIED",validationFormula,validationValue,supplemental};
  };
  if(filing.edinetCode==="E02144"){
    const current=component("Current interest-bearing liabilities",pick(["InterestBearingLiabilitiesCLIFRS"]),p,s),noncurrent=component("Non-current interest-bearing liabilities",pick(["InterestBearingLiabilitiesNCLIFRS"]),p,s);
    p.currentDebt=datum(current,s);p.noncurrentDebt=datum(noncurrent,s);
    const n=note(xml,"NotesInterestBearingLiabilitiesConsolidatedFinancialStatementsIFRSTextBlock",filing,ns),segments=note(xml,"ManagementAnalysisOfFinancialPositionOperatingResultsAndCashFlowsTextBlock",filing,ns,true);
    const noteTotal=tableValue(n,"有利子負債合計",p.end),sourceTotal=hasDeclared?declared?.value??null:noteTotal,sum=current.value!==null&&noncurrent.value!==null?current.value+noncurrent.value:null;
    if(hasDeclared)add("D1/structured-total-quality",!!declared&&(!n||noteTotal===null||noteTotal===declared.value),"Structured正式合計の重複・通貨・明示注記との不一致を除外。不正な正式合計を無視して計算へ切替えません。");
    add("D1/source-declared-total",sourceTotal!==null,"明示された有利子負債合計と対象年度の表列を採用。曖昧な本文数値・総負債は採用しません。",declared?declared.prefix+":"+declared.name:n?.name);
    add("D2/current-noncurrent",sum!==null,"連結・期末instant・JPY・標準namespaceの流動/非流動factで照合。合算はValidationのみ。");
    add("D2/total-cross-check",sum!==null&&sourceTotal===sum,"原文合計と流動＋非流動の一致を確認。不一致はUNVERIFIED。");
    add("D2/no-lease-double-count",sourceTotal!==null&&sum!==null&&sourceTotal===sum,"原文の有利子負債合計をPrimaryにし、既に含まれるリースは再加算しません。",n?.name);
    primary(sourceTotal,"SOURCE_DECLARED_TOTAL",declared?declared.prefix+":"+declared.name+" / context="+declared.context.id:(n?.name??"unverified.interest_bearing_debt_total")+" / 有利子負債合計 / "+p.end,[current,noncurrent],"current + noncurrent (validation only)",sum,supplement(segments,p,s));
    return;
  }
  const names=["BondsAndBorrowingsCLIFRS","BondsAndBorrowingsNCLIFRS","LeaseLiabilitiesCLIFRS","LeaseLiabilitiesNCLIFRS"],components=names.map(name=>component(name,pick([name]),p,s));
  const bs=note(xml,"ConsolidatedStatementOfFinancialPositionIFRSTextBlock",filing,ns),borrowings=note(xml,"NotesBorrowingsAndOtherFinancialLiabilitiesConsolidatedFinancialStatementsIFRSTextBlock",filing,ns),leases=note(xml,"NotesLeasesConsolidatedFinancialStatementsIFRSTextBlock",filing,ns);
  const noteTotal=tableValue(borrowings,"有利子負債合計",p.end);
  const maturity=["流動負債","非流動負債","流動負債","非流動負債"],labels=["社債及び借入金","社債及び借入金","リース負債","リース負債"];
  const complete=components.every(c=>c.value!==null),separate=complete&&components.every((c,i)=>tableValue(bs,labels[i],p.end,undefined,maturity[i])===c.value);
  const borrowingText=compact(borrowings?.text??""),leaseText=compact(leases?.text??"");
  const borrowingProof=borrowingText.includes("セール・アンド・リースバック")&&borrowingText.includes("IFRS第16号")&&borrowingText.includes("売却の要件を満たさない")&&borrowingText.includes("売却及びリースとして会計処理していません")&&borrowingText.includes("長期借入金として会計処理しています");
  const leaseProof=leaseText.includes("セール・アンド・リースバック")&&leaseText.includes("IFRS第16号")&&leaseText.includes("売却の要件を満たさない")&&leaseText.includes("売却及びリースとして会計処理していません")&&leaseText.includes("借入金及びその他の金融負債");
  const overlap=/借入金にリース負債を含|借入金にはリース負債が含|社債及び借入金はリース負債を含|リース負債は社債及び借入金に含|リース負債を借入金に含め/.test(borrowingText+leaseText);
  add("D2/no-overlap-contradiction",!overlap,"借入金に認識済みリース負債を含むとの矛盾記載がないことを確認。重複関係が不明なら採用しません。",borrowings?.name);
  if(noteTotal!==null)add("D1/note-total-cross-check",(complete?components.reduce((v,c)=>v+c.value!,0):null)===noteTotal&&(!hasDeclared||declared?.value===noteTotal),"明示された正式合計の年度列と構成要素を照合。金融負債全体の合計とは区別。",borrowings?.name);
  if(hasDeclared)add("D1/structured-total-quality",!!declared&&(complete?components.reduce((v,c)=>v+c.value!,0):null)===declared.value,"Structured正式合計を優先し、構成要素と一致することを検証。不正・不一致はUNVERIFIED。");
  add("D2/components-quality",complete,"4つの標準factを連結・同じ期末・JPY・instantで確認。");
  add("D2/separate-balance-sheet-lines",separate,"借入/社債とリースが連結財政状態計算書の別行にあり、4つのfactと一致。その他金融負債の合計を使いません。",bs?.name);
  add("D2/sale-and-leaseback-borrowing",borrowingProof,"注記14：売却/リース要件を満たさない取引の資金は長期借入金として認識。既存借入factに含まれるので追加加算しません。",borrowings?.name);
  add("D2/lease-exclusion-confirmation",leaseProof,"注記15：同じ取引を売却/リースとして認識せず注記14へ参照。借入金と認識済みリース負債の重複を排除。",leases?.name);
  const sum=complete?components.reduce((total,c)=>total+c.value!,0):null;
  if(complete&&separate&&borrowingProof&&leaseProof&&!overlap){
    const make=(indices:number[],label:string):Datum=>({value:indices.reduce((v,i)=>v+components[i].value!,0),source:{...s,field:label+" = "+indices.map(i=>components[i].sourceField).join(" + "),contextRef:"CurrentYearInstant",unit:"currency"}});
    p.currentDebt=make([0,2],"Current Debt");p.noncurrentDebt=make([1,3],"Noncurrent Debt");
  }
  primary(hasDeclared?declared?.value??null:noteTotal??sum,declared||noteTotal!==null?"SOURCE_DECLARED_TOTAL":"CALCULATED_FROM_COMPONENTS",declared?declared.prefix+":"+declared.name+" / context="+declared.context.id:noteTotal!==null?borrowings!.name+" / 有利子負債合計 / "+p.end:"calculated_from_bonds_borrowings_and_leases / "+p.end,components,"BondsAndBorrowingsCLIFRS + BondsAndBorrowingsNCLIFRS + LeaseLiabilitiesCLIFRS + LeaseLiabilitiesNCLIFRS",sum);
}
/** Narrow generic Japan-GAAP contract: a complete borrowing schedule with one short-term line,
 * zero ending bonds explicitly disclosed, and a dated consolidated BS cross-check.
 * Other schedules stay UNVERIFIED rather than guessed component sums. */
function applyJapanGaapSingleBorrowing(xml:string,filing:EdinetFiling,p:FinancialPeriod,facts:DebtFact[]):boolean {
  if(p.basis!=="annual"||p.end!==filing.periodEnd||!filing.periodStart||p.currency!=="JPY")return false;
  const ns=namespaces(xml),standard=(prefix:string)=>/^https?:\/\/disclosure\.edinet-fsa\.go\.jp\/taxonomy\/jppfs\/\d{4}-\d{2}-\d{2}\/jppfs_cor$/.test(ns[prefix]??"");
  const eligible=facts.filter(f=>standard(f.prefix)&&f.name==="ShortTermLoansPayable"&&f.context.id==="CurrentYearInstant"&&f.context.start===null&&f.context.end===p.end);
  if(!eligible.length)return false;
  const fact=eligible.length===1?eligible[0]:undefined,s=p.debt.source;
  const borrowing=note(xml,"AnnexedConsolidatedDetailedScheduleOfBorrowingsTextBlock",filing,ns),bonds=note(xml,"AnnexedConsolidatedDetailedScheduleOfCorporateBondsTextBlock",filing,ns),bs=note(xml,"ConsolidatedBalanceSheetTextBlock",filing,ns);
  const validUnit=!!fact&&[...xml.matchAll(/<(?:[\w.-]+:)?unit\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?unit>/g)].filter(u=>attributes(u[1]).id===fact.unitRef).some(u=>{
    const m=[...u[2].matchAll(/<(?:[\w.-]+:)?measure>([^<]*)<\/(?:[\w.-]+:)?measure>/g)];const parts=m[0]?.[1].trim().split(":");return m.length===1&&!/divide|unitNumerator|unitDenominator/.test(u[2])&&parts?.[1]==="JPY"&&ns[parts[0]]==="http://www.xbrl.org/2003/iso4217";
  });
  const endingTables=(n:Note|null)=>n?tables(n).filter(rows=>rows[0]?.filter(c=>compact(c.text)==="当期末残高(百万円)").length===1):[];
  const schedules=endingTables(borrowing),rows=schedules.length===1?schedules[0]:[],column=rows[0]?.findIndex(c=>compact(c.text)==="当期末残高(百万円)")??-1;
  const items=rows.slice(1).filter(r=>!r.every(c=>c===r[0])||!compact(r[0]?.text??"").startsWith("(注)")),single=items.length===2&&compact(items[0][0]?.text??"")==="短期借入金"&&compact(items[1][0]?.text??"")==="合計";
  const borrowed=column>=0?millions(items[0]?.[column]?.text):null,total=column>=0?millions(items[1]?.[column]?.text):null;
  const bondTables=endingTables(bonds),bondRows=bondTables.length===1?bondTables[0]:[],bondColumn=bondRows[0]?.findIndex(c=>compact(c.text)==="当期末残高(百万円)")??-1;
  // A source cell marked dash is explicitly no ending balance; an absent cell is never zero.
  const zeroCell=(v:string|undefined)=>v!==undefined&&/^(?:-|−|―|—|0)$/.test(compact(v));
  const zeroBonds=bondColumn>=0&&bondRows.length>1&&bondRows.slice(1).every(r=>zeroCell(r[bondColumn]?.text))&&compact(bondRows.at(-1)?.[0]?.text??"")==="合計";
  const bsValues=bs?tables(bs).flatMap(rows=>{if(!/(?:単位|金額):百万円/.test(compact(rows.flatMap(r=>r.map(c=>c.text)).join(" "))))return [];const c=fiscalColumn(rows,p.end);return c===null?[]:rows.filter(r=>compact(r[0]?.text??"")==="短期借入金").map(r=>millions(r[c]?.text.replace(/^(?:\s*※\d+\s*,?)+\s*/,"")));}):[];
  const bsValue=bsValues.length===1?bsValues[0]:null;
  const otherFacts=facts.filter(f=>debtConcepts.includes(f.name)&&f.name!=="ShortTermLoansPayable"&&f.context.end===p.end&&f.context.start===null);
  const unexpectedBs=bs?tables(bs).some(rows=>{const c=fiscalColumn(rows,p.end);return c!==null&&rows.some(r=>/借入|リース|社債|有利子|金融負債/.test(compact(r[0]?.text??""))&&compact(r[0]?.text??"")!=="短期借入金"&&!zeroCell(r[c]?.text));}):true;
  const formalTotalPresent=facts.some(f=>["InterestBearingLiabilitiesLiabilitiesIFRS","BondsAndBorrowingsLiabilitiesIFRS"].includes(f.name)&&f.context.end===p.end&&f.context.start===null);
  const checks:DebtEvidence["checks"]=[
    {id:"D1/no-unvalidated-formal-total",passed:!formalTotalPresent,detail:"未検証の正式合計が併存する場合は、それを無視して単一成分へ切り替えません。"},
    {id:"D1/structured-quality",passed:!!fact&&validUnit&&fact.unit==="JPY"&&fact.value!==null&&Number.isSafeInteger(fact.value)&&fact.value>=0,detail:"一意な標準JPPFS・連結当期末・正式JPY unit。"},
    {id:"D2/complete-borrowing-schedule",passed:single&&borrowed!==null&&total===borrowed&&borrowed===fact?.value,detail:"当期末残高列の短期借入金と合計を照合。未対応の内訳は合算しません。",sourceField:borrowing?.name},
    {id:"D2/explicit-ending-bonds",passed:zeroBonds,detail:"当期末社債残高は全行と合計で明示的に残高なし。未記載をゼロにしません。",sourceField:bonds?.name},
    {id:"D2/consolidated-bs",passed:bsValue!==null&&bsValue===borrowed&&!unexpectedBs,detail:"同年度の連結貸借対照表と一致し、他のDebt行に未照合残高がないことを確認。",sourceField:bs?.name},
    {id:"D2/no-double-count",passed:otherFacts.length===0&&single&&zeroBonds&&!unexpectedBs,detail:"短期借入金を一度のみ採用。社債・リース・他要素との未確認重複があれば保留。"}
  ];
  const confirmed=checks.every(c=>c.passed),part=component("Short-term borrowings",fact,p,s),value=confirmed?fact!.value:null;
  p.debt={value,source:{...s,currency:p.currency,start:null,field:(fact?fact.prefix+":"+fact.name:"unverified.short_term_borrowings")+" / validated borrowing + bond schedules",contextRef:"CurrentYearInstant"},
    sourceType:confirmed?"CALCULATED_FROM_COMPONENTS":"UNVERIFIED",sourceField:part.sourceField,fiscalDate:p.end,currency:p.currency,scope:"CONSOLIDATED",confidence:confirmed?"CONFIRMED":"UNVERIFIED",components:[part],checks,doubleCount:confirmed?"NO":"UNVERIFIED",validationFormula:"validated short-term borrowings (complete schedules; no ending bonds)",validationValue:value,supplemental:[]};
  p.currentDebt=datum({...part,value},s);return true;
}
