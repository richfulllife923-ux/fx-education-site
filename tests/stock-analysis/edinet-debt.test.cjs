// TEST DATA ONLY: explicit D1-D3 XML contracts; runtime never imports these fixtures.
require("./register.cjs");
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const {normalizeEdinetXbrl}=require("../../server/stock-analysis/edinet-xbrl.ts");
const {researchStatusForCompany}=require("../../server/stock-analysis/research-status.ts");
const {buildReport}=require("../../server/stock-analysis/engine.ts");
const date="2026-03-31",retrieved="2026-10-01T00:00:00Z";
const row=(issuer="E02144")=>({docID:"S100TEST",edinetCode:issuer,secCode:issuer==="E02144"?"72030":"285A0",filerName:"TEST DATA",docTypeCode:"120",periodStart:"2025-04-01",periodEnd:date,submitDateTime:"2026-06-24 11:15",parentDocID:null,xbrlFlag:"1",withdrawalStatus:"0",disclosureStatus:"0"});
const escape=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const table=(header,rows)=>`<table><tr><td colspan="${header.length}">金額：百万円</td></tr><tr>${header.map(s=>`<td>${s}</td>`).join("")}</tr>${rows.map(r=>`<tr>${r.map(s=>`<td>${s}</td>`).join("")}</tr>`).join("")}</table>`;
const headers=["項目","2025年3月31日","2026年3月31日"];
const note=(name,html,prefix="jpigp_cor",context="CurrentYearDuration")=>`<${prefix}:${name} contextRef="${context}">${escape(html)}</${prefix}:${name}>`;
const fact=(name,val,context="CurrentYearInstant",unit="JPY",prefix="jpigp_cor")=>`<${prefix}:${name} contextRef="${context}" unitRef="${unit}" decimals="-6">${val}</${prefix}:${name}>`;
function xml(issuer,body){return `<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance" xmlns:iso4217="http://www.xbrl.org/2003/iso4217" xmlns:jpigp_cor="http://disclosure.edinet-fsa.go.jp/taxonomy/jpigp/2025-11-01/jpigp_cor" xmlns:jpcrp_cor="http://disclosure.edinet-fsa.go.jp/taxonomy/jpcrp/2025-11-01/jpcrp_cor" xmlns:ext="http://disclosure.edinet-fsa.go.jp/jpcrp030000/asr/001/${issuer}-000/2026-03-31/01/2026-06-24" xmlns:evil="https://example.invalid/taxonomy" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<xbrli:context id="CurrentYearDuration"><xbrli:entity><xbrli:identifier>${issuer}-000</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:startDate>2025-04-01</xbrli:startDate><xbrli:endDate>${date}</xbrli:endDate></xbrli:period></xbrli:context>
<xbrli:context id="CurrentYearInstant"><xbrli:entity><xbrli:identifier>${issuer}-000</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:instant>${date}</xbrli:instant></xbrli:period></xbrli:context>
<xbrli:context id="FilingDateInstant"><xbrli:entity><xbrli:identifier>${issuer}-000</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:instant>2026-06-24</xbrli:instant></xbrli:period></xbrli:context>
<xbrli:unit id="JPY"><xbrli:measure>iso4217:JPY</xbrli:measure></xbrli:unit><xbrli:unit id="USD"><xbrli:measure>iso4217:USD</xbrli:measure></xbrli:unit>
${fact("RevenueIFRS",1000000000,"CurrentYearDuration")}${body}</xbrli:xbrl>`;}
const toyotaBody=(total="300",extra="")=>fact("InterestBearingLiabilitiesCLIFRS",100000000)+fact("InterestBearingLiabilitiesNCLIFRS",200000000)+note("NotesInterestBearingLiabilitiesConsolidatedFinancialStatementsIFRSTextBlock","18．有利子負債"+table(["項目","2025年4月1日","2026年3月31日"],[["流動合計","90","100"],["非流動合計","190","200"],["有利子負債合計","280",total]]))+extra;
function kioxiaBody({proof=true,bs=true}={}){
 const values=[["BondsAndBorrowingsCLIFRS",100000000],["BondsAndBorrowingsNCLIFRS",200000000],["LeaseLiabilitiesCLIFRS",30000000],["LeaseLiabilitiesNCLIFRS",40000000]];
 const balance=note("ConsolidatedStatementOfFinancialPositionIFRSTextBlock",table(headers,[["流動負債","",""],["社債及び借入金","90","100"],["リース負債","20","30"],["その他の金融負債","15","25"],["非流動負債","",""],["社債及び借入金","190","200"],["リース負債","35","40"]]));
 const definition=proof?"セール・アンド・リースバック取引は、IFRS第16号により売却の要件を満たさないため、売却及びリースとして会計処理していません。そのため、当該取引により調達した資金を長期借入金として会計処理しています。":"関係の記載なし";
 return values.map(([n,v])=>fact(n,v)).join("")+(bs?balance:"")+note("NotesBorrowingsAndOtherFinancialLiabilitiesConsolidatedFinancialStatementsIFRSTextBlock","14．借入金及びその他の金融負債"+definition,"ext")+note("NotesLeasesConsolidatedFinancialStatementsIFRSTextBlock","15．リース "+(proof?"セール・アンド・リースバック取引は、IFRS第16号により売却の要件を満たさないため、売却及びリースとして会計処理していません。注記14．借入金及びその他の金融負債を参照ください。":"関係の記載なし"));
}
const parse=(issuer,body)=>normalizeEdinetXbrl(xml(issuer,body),row(issuer),retrieved)[0];
function company(p){const s=p.revenue.source;return {provider:"EDINET",mode:"FREE",valuationStatus:"LIMITED",primarySource:{...s,classification:"FACT"},filings:[{period:p.end,url:s.url,title:s.title,filed:s.filingDate,amended:false}],identity:{symbol:"7203.JP",code:"7203",name:"TEST DATA",country:"JP",exchange:"JP",currency:"JPY"},annual:[p],quarterly:[],quote:null,description:null,sector:null,industry:null,website:null,cik:null,updatedAt:null,retrievedAt:retrieved,valuation:{},earnings:[],issues:[]};}

test("D1/D2 Toyota source-declared total is primary and components only validate",()=>{
 const p=parse("E02144",toyotaBody());assert.equal(p.debt.value,300000000);assert.equal(p.debt.sourceType,"SOURCE_DECLARED_TOTAL");assert.equal(p.debt.scope,"CONSOLIDATED");assert.equal(p.currentDebt.value,100000000);assert.equal(p.noncurrentDebt.value,200000000);assert.equal(p.debt.doubleCount,"NO");assert.ok(p.debt.sourceField.includes("NotesInterestBearing"));assert.ok(p.debt.checks.every(c=>c.passed));
});
test("Toyota missing explicit formal total cannot be replaced by a component sum",()=>{
 const body=toyotaBody().replace(/有利子負債合計/g,"金融負債合計");const p=parse("E02144",body);assert.equal(p.debt.value,null);assert.equal(p.debt.sourceType,"UNVERIFIED");
});
test("Toyota source total mismatch is UNVERIFIED; no component override",()=>{const p=parse("E02144",toyotaBody("301"));assert.equal(p.debt.value,null);assert.equal(p.debt.sourceType,"UNVERIFIED");});
test("Toyota period column, table unit and context are mandatory",()=>{
 for(const body of [toyotaBody().replace(/2026年3月31日/g,"2025年3月31日"),toyotaBody().replace(/百万円/g,"千円"),toyotaBody().replace('NotesInterestBearingLiabilitiesConsolidatedFinancialStatementsIFRSTextBlock contextRef="CurrentYearDuration"','NotesInterestBearingLiabilitiesConsolidatedFinancialStatementsIFRSTextBlock contextRef="FilingDateInstant"')])assert.equal(parse("E02144",body).debt.value,null);
});
test("No free-text source-total guessing or ambiguous duplicate totals",()=>{
 const simple=toyotaBody().replace(/&lt;table[\s\S]*?&lt;\/table&gt;/,"有利子負債合計 300百万円 2026年3月31日");assert.equal(parse("E02144",simple).debt.value,null);
 const duplicate=toyotaBody()+note("NotesInterestBearingLiabilitiesConsolidatedFinancialStatementsIFRSTextBlock",table(headers,[["有利子負債合計","200","300"]]));assert.equal(parse("E02144",duplicate).debt.value,null);
});
test("D3 Toyota segment debt remains supplemental; segment sum cannot replace primary",()=>{
 const seg=note("ManagementAnalysisOfFinancialPositionOperatingResultsAndCashFlowsTextBlock","自動車等セグメントと金融セグメントを区分した連結財政状態計算書"+table(headers,[["（自動車等）","",""],["流動負債","",""],["有利子負債","10","15"],["非流動負債","",""],["有利子負債","20","25"],["（金融）","",""],["流動負債","",""],["有利子負債","80","90"],["非流動負債","",""],["有利子負債","170","185"],["（消去）負債消去計","-10","-20"]]),"jpcrp_cor","FilingDateInstant");
 const p=parse("E02144",toyotaBody("300",seg));assert.equal(p.debt.value,300000000);assert.equal(p.debt.supplemental.length,2);assert.ok(p.debt.supplemental.every(s=>s.role==="SUPPLEMENTAL"));assert.equal(p.debt.supplemental.find(s=>s.scope==="FINANCIAL_BUSINESS").current.value,90000000);
 const noPrimary=parse("E02144",seg);assert.equal(noPrimary.debt.value,null);
});
test("Kioxia calculation requires separate BS lines and both formal accounting notes",()=>{
 const p=parse("E35948",kioxiaBody());assert.equal(p.debt.value,370000000);assert.equal(p.debt.sourceType,"CALCULATED_FROM_COMPONENTS");assert.equal(p.debt.components.length,4);assert.equal(p.debt.doubleCount,"NO");assert.ok(p.debt.checks.every(c=>c.passed));assert.equal(p.currentDebt.value,130000000);assert.equal(p.noncurrentDebt.value,240000000);
});
test("Kioxia financial liabilities are not used blindly",()=>{
 const body=fact("LiabilitiesIFRS",999000000)+note("NotesBorrowingsAndOtherFinancialLiabilitiesConsolidatedFinancialStatementsIFRSTextBlock",table(headers,[["合計","300","1075906"]]),"ext");const p=parse("E35948",body);assert.equal(p.debt.value,null);
});
test("Kioxia missing double-count proof or separate balance sheet is UNVERIFIED",()=>{
 for(const options of [{proof:false},{bs:false}]){const p=parse("E35948",kioxiaBody(options));assert.equal(p.debt.value,null);assert.equal(p.debt.sourceType,"UNVERIFIED");assert.equal(p.debt.doubleCount,"UNVERIFIED");}
});
test("Missing component, wrong currency, wrong namespace and duration values cannot be adopted",()=>{
 for(const body of [kioxiaBody().replace(fact("LeaseLiabilitiesNCLIFRS",40000000),""),kioxiaBody().replace(fact("LeaseLiabilitiesNCLIFRS",40000000),fact("LeaseLiabilitiesNCLIFRS",40000000,"CurrentYearInstant","USD")),kioxiaBody().replace(fact("LeaseLiabilitiesNCLIFRS",40000000),fact("LeaseLiabilitiesNCLIFRS",40000000,"CurrentYearInstant","JPY","evil")),kioxiaBody().replace(fact("LeaseLiabilitiesNCLIFRS",40000000),fact("LeaseLiabilitiesNCLIFRS",40000000,"CurrentYearDuration"))])assert.equal(parse("E35948",body).debt.value,null);
});
test("Nonconsolidated or unwanted dimension cannot fill consolidated Debt",()=>{
 for(const dim of ['<xbrldi:explicitMember dimension="jpigp_cor:ConsolidatedOrNonConsolidatedAxis">jpigp_cor:NonConsolidatedMember</xbrldi:explicitMember>','<xbrldi:explicitMember dimension="jpigp_cor:OperatingSegmentsAxis">jpigp_cor:FinanceMember</xbrldi:explicitMember>']){
 const source=xml("E02144",toyotaBody()).replace('id="CurrentYearInstant"><xbrli:entity>','id="CurrentYearInstant"><xbrli:scenario>'+dim+'</xbrli:scenario><xbrli:entity>');const p=normalizeEdinetXbrl(source,row(),retrieved)[0];assert.equal(p.debt.value,null);
 }
});
test("Wrong issuer, duplicate component, zero-fill and old-year fallback are rejected",()=>{
 assert.throws(()=>normalizeEdinetXbrl(xml("E35948",kioxiaBody()),row("E02144"),retrieved),e=>e.code==="DATA_PROVIDER_ERROR");
 assert.equal(parse("E35948",kioxiaBody()+fact("LeaseLiabilitiesCLIFRS",30000000)).debt.value,null);
 const old=kioxiaBody().replace(/contextRef="CurrentYearInstant"/g,'contextRef="PriorYearInstant"');assert.equal(parse("E35948",old).debt.value,null);
 assert.equal(parse("E35948",kioxiaBody().replace(fact("LeaseLiabilitiesCLIFRS",30000000),"")).debt.value,null);
});
test("Debt available progresses R6; it never makes Risk clear or GREEN",()=>{
 const c=company(parse("E02144",toyotaBody()));const r=researchStatusForCompany(c);assert.equal(r.dataCompleteness.debt,"AVAILABLE");assert.equal(r.status,"STAY");assert.ok(r.pendingReasons.some(s=>s.includes("重大リスク")));assert.ok(r.pendingReasons.some(s=>s.includes("現在価格")));
});
test("Calculated Debt is CALCULATION with trace; breakdown is audit-only",()=>{
 const report=buildReport(company(parse("E35948",kioxiaBody())));const d=report.sections.finance.find(s=>s.label==="Debt");assert.equal(d.kind,"CALCULATION");assert.equal(d.debt.sourceType,"CALCULATED_FROM_COMPONENTS");assert.equal(d.inputs.length,4);assert.ok(report.sections.finance.filter(s=>s.debtRole==="BREAKDOWN").length===2);
});
for(const [symbol,file,total,type] of [["7203","toyota-audit-S100Y8NY.xbrl",43205469000000,"SOURCE_DECLARED_TOTAL"],["285A","toyota-audit-S100YJ18.xbrl",1253189000000,"CALCULATED_FROM_COMPONENTS"]]){
 const path=".stock-test-output/"+file;
 test("Saved official FY2026 XBRL replay: "+symbol,{skip:!fs.existsSync(path)},()=>{
 const idx=JSON.parse(fs.readFileSync("server/stock-analysis/edinet-filings.json","utf8"));const f=idx.filings.find(f=>f.docID===(symbol==="7203"?"S100Y8NY":"S100YJ18"));const p=normalizeEdinetXbrl(fs.readFileSync(path,"utf8"),f,retrieved).find(p=>p.end===date);assert.equal(p.debt.value,total);assert.equal(p.debt.sourceType,type);assert.equal(p.debt.doubleCount,"NO");
 });
}

test("Structured formal total has priority; conflicting or duplicated totals never fall back",()=>{
 const good=parse("E02144",toyotaBody()+fact("InterestBearingLiabilitiesLiabilitiesIFRS",300000000));assert.equal(good.debt.sourceType,"SOURCE_DECLARED_TOTAL");assert.ok(good.debt.sourceField.includes("InterestBearingLiabilitiesLiabilitiesIFRS"));
 const conflicting=parse("E02144",toyotaBody()+fact("InterestBearingLiabilitiesLiabilitiesIFRS",301000000));assert.equal(conflicting.debt.value,null);
 const duplicate=parse("E35948",kioxiaBody()+fact("BondsAndBorrowingsLiabilitiesIFRS",370000000)+fact("BondsAndBorrowingsLiabilitiesIFRS",370000000));assert.equal(duplicate.debt.value,null);
});
test("An explicit lease-in-borrowings contradiction blocks component adoption",()=>{
 const body=kioxiaBody().replace("長期借入金として会計処理しています。","長期借入金として会計処理しています。借入金にはリース負債が含まれます。");const p=parse("E35948",body);assert.equal(p.debt.value,null);assert.equal(p.debt.doubleCount,"UNVERIFIED");
});
test("Kioxia balance-sheet mismatch and note issuer/date mismatch block adoption",()=>{
 for(const body of [kioxiaBody().replace("&gt;30&lt;","&gt;31&lt;")])assert.equal(parse("E35948",body).debt.value,null);
 const badNamespace=xml("E35948",kioxiaBody()).replace("/E35948-000/2026-03-31/","/E02144-000/2026-03-31/");assert.equal(normalizeEdinetXbrl(badNamespace,row("E35948"),retrieved)[0].debt.value,null);
 const old=xml("E35948",kioxiaBody()).replace("/E35948-000/2026-03-31/","/E35948-000/2025-03-31/");assert.equal(normalizeEdinetXbrl(old,row("E35948"),retrieved)[0].debt.value,null);
});

test("Kioxia explicit, dated formal total has priority over component calculation",()=>{
 const body=kioxiaBody().replace("長期借入金として会計処理しています。","長期借入金として会計処理しています。"+escape(table(headers,[["有利子負債合計","300","370"]])));
 const p=parse("E35948",body);assert.equal(p.debt.value,370000000);assert.equal(p.debt.sourceType,"SOURCE_DECLARED_TOTAL");assert.ok(p.debt.sourceField.includes("有利子負債合計"));
});

test("Debt IFRS concept cannot use a different official taxonomy or a forged JPY measure",()=>{
 const wrongTax=xml("E02144",toyotaBody()).replace('/taxonomy/jpigp/2025-11-01/jpigp_cor','/taxonomy/jppfs/2025-11-01/jppfs_cor');assert.equal(normalizeEdinetXbrl(wrongTax,row(),retrieved)[0].debt.value,null);
 const wrongUnit=xml("E02144",toyotaBody()).replace('xmlns:iso4217="http://www.xbrl.org/2003/iso4217"','xmlns:iso4217="https://example.invalid/currency"');assert.equal(normalizeEdinetXbrl(wrongUnit,row(),retrieved)[0].debt.value,null);
});
