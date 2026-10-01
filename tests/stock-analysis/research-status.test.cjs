// TEST DATA: explicit condition attestations below are synthetic; no production rules/thresholds.
require("./register.cjs");
const {test}=require("node:test"),assert=require("node:assert/strict");
const {evaluateResearchStatus}=require("../../lib/research-status.ts");
const condition=()=>({state:"MET",reason:"TEST DATA formal condition attested",evidenceRefs:["TEST DATA"]});
const base=()=>({
 provider:"READY",identity:"VERIFIED",latestAnnual:"AVAILABLE",primaryEvidence:"AVAILABLE",dataIntegrity:"VALID",
 debt:"AVAILABLE",operatingCF:"AVAILABLE",freeCF:"AVAILABLE",cashFlowMissingSeverity:"NOT_MAJOR",
 majorRisk:"CLEAR",counterThesisMajorRisk:"CLEAR",valuation:"AVAILABLE",growthMode:"STANDARD",
 conditions:Object.fromEntries(["business","financials","cashFlow","balanceSheet","risk","counterThesis","valuation","growth"].map(key=>[key,condition()])),
 sourceFiscalYear:"2026-03-31",existingResearchState:"REJECT",ownerDecisionsRequired:[]
});
test("R1 all formal conditions met yields GREEN without mapping existing REJECT",()=>{
 const input=base(),copy=structuredClone(input),r=evaluateResearchStatus(input);
 assert.equal(r.status,"GREEN");assert.equal(r.existingResearchState,"REJECT");assert.deepEqual(input,copy);
 assert.ok(r.ruleTrace.every(t=>t.ruleId && t.inputState && t.result && t.reason));
 assert.ok(r.passedReasons.length);assert.equal(r.blockingReasons.length,0);
});
test("R3 provider, identity, latest annual and primary source blockers independently yield GRAY",()=>{
 for(const patch of [{provider:"ERROR"},{identity:"UNRESOLVED"},{latestAnnual:"MISSING"},{primaryEvidence:"MISSING"},{dataIntegrity:"MAJOR_ISSUE"}]){
  const r=evaluateResearchStatus({...base(),...patch});assert.equal(r.status,"GRAY");assert.ok(r.blockingReasons.length);
 }
});
test("R6 missing Debt overrides Valuation missing STAY",()=>{
 const r=evaluateResearchStatus({...base(),debt:"MISSING",valuation:"MISSING"});
 assert.equal(r.status,"GRAY");assert.ok(r.shortReason.includes("有利子負債"));assert.ok(r.nextChecks[0].includes("有利子負債"));assert.ok(r.pendingReasons.some(v=>v.includes("価格")));
});
test("R7 explicitly unresolved major risk and counter-thesis override debt and Valuation",()=>{
 for(const key of ["majorRisk","counterThesisMajorRisk"]){
  const r=evaluateResearchStatus({...base(),[key]:"UNRESOLVED",debt:"MISSING",valuation:"MISSING"});
  assert.equal(r.status,"GRAY");assert.ok(r.shortReason.includes("重大"));
 }
});
test("R10 Provider/Data Integrity takes precedence over Major Risk",()=>{
 const r=evaluateResearchStatus({...base(),provider:"ERROR",majorRisk:"UNRESOLVED"});
 assert.equal(r.status,"GRAY");assert.ok(r.shortReason.includes("一次資料"));assert.ok(r.blockingReasons.length>=2);
});
test("R4 missing Valuation yields STAY when data and risk gates pass",()=>{
 const r=evaluateResearchStatus({...base(),valuation:"MISSING"});
 assert.equal(r.status,"STAY");assert.ok(r.pendingReasons.length);assert.ok(r.nextChecks.some(v=>v.includes("価格")));
});
test("R4 Valuation condition not met yields STAY",()=>{
 const input=base();input.conditions.valuation.state="NOT_MET";assert.equal(evaluateResearchStatus(input).status,"STAY");
});
test("R8 Emerging Growth unmet condition yields STAY",()=>{
 const input=base();input.growthMode="EMERGING";input.conditions.growth.state="NOT_MET";
 assert.equal(evaluateResearchStatus(input).status,"STAY");
});
test("R8 ordinary mature company weak Growth alone cannot block GREEN",()=>{
 const input=base();input.conditions.growth.state="NOT_MET";
 assert.equal(evaluateResearchStatus(input).status,"GREEN");
});
test("R5 OCF and FCF are both required; explicit major missing -> GRAY, otherwise pending",()=>{
 for(const key of ["operatingCF","freeCF"]){
  const input={...base(),[key]:"MISSING",cashFlowMissingSeverity:"MAJOR"};
  assert.equal(evaluateResearchStatus(input).status,"GRAY");
  const r=evaluateResearchStatus({...input,cashFlowMissingSeverity:"UNVERIFIED"});
  assert.equal(r.status,"STAY");assert.ok(r.ownerDecisionsRequired.length);
 }
});
test("Unverified Risk, Business, CF or Valuation are never inferred safe/met",()=>{
 for(const key of ["business","cashFlow","valuation","risk","counterThesis","financials","balanceSheet"]){
  const input=base();input.conditions[key].state="UNVERIFIED";
  const r=evaluateResearchStatus(input);assert.equal(r.status,"STAY");assert.ok(r.pendingReasons.length);
 }
 const r=evaluateResearchStatus({...base(),majorRisk:"UNVERIFIED"});assert.equal(r.status,"STAY");
});
test("MET with no traceable evidence does not authorize GREEN",()=>{
 const input=base();input.conditions.business.evidenceRefs=[];
 assert.equal(evaluateResearchStatus(input).status,"STAY");
});
test("R9 each existing state passes through untouched and is not a color rule",()=>{
 for(const state of ["RESEARCH","WATCH","DEEPER REVIEW","HOLDING REVIEW","REJECT"]){
  const r=evaluateResearchStatus({...base(),existingResearchState:state,valuation:"MISSING"});
  assert.equal(r.existingResearchState,state);assert.equal(r.status,"STAY");
 }
});
test("R1 unknown availability and pending required conditions cannot pass",()=>{
 for(const patch of [{debt:"UNVERIFIED"},{primaryEvidence:"UNVERIFIED"},{identity:"UNVERIFIED"},{dataIntegrity:"UNVERIFIED"}]){
  assert.notEqual(evaluateResearchStatus({...base(),...patch}).status,"GREEN");
 }
});

const {researchInput,researchStatusForCompany}=require("../../server/stock-analysis/research-status.ts");
const {emptyPeriod,emptyValuation}=require("../../server/stock-analysis/primary-model.ts");
const {AnalysisService}=require("../../server/stock-analysis/service.ts");
const {buildReport}=require("../../server/stock-analysis/engine.ts");
const {publicValue,publicSourceUrl}=require("../../lib/stock-analysis-presentation.ts");
function company(){
 const s={provider:"EDINET",url:"https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100TEST",title:"TEST DATA filing",
 retrievedAt:"2026-10-01T00:00:00Z",asOf:"2026-06-24",filingDate:"2026-06-24",classification:"FACT",
 field:"TEST DATA",basis:"annual",period:"2026-03-31",currency:"JPY",unit:"currency"};
 const annual=emptyPeriod("2026-03-31","annual","JPY",s);
 for(const field of ["revenue","operatingIncome","netIncome","operatingCF","cash","equity","assets"])annual[field].value=100;
 annual.capex.value=20;annual.debt.value=0;
 return {provider:"EDINET",mode:"FREE",valuationStatus:"LIMITED",primarySource:s,
  filings:[{url:s.url,title:s.title,filed:s.filingDate,period:s.period,amended:false}],
  identity:{name:"TEST DATA Company",symbol:"7203.JP",code:"7203",exchange:"JP",country:"JP",currency:"JPY"},
  description:null,sector:null,industry:null,website:null,cik:null,updatedAt:s.asOf,retrievedAt:s.retrievedAt,
  annual:[annual],quarterly:[],quote:null,valuation:emptyValuation(s),earnings:[],issues:[]};
}
test("Canonical adapter never equates positive CF, source dates, narrative templates, or numeric zero to missing/safe",()=>{
 const c=company(),before=structuredClone(c),input=researchInput(c);
 assert.equal(input.debt,"AVAILABLE");assert.equal(input.operatingCF,"AVAILABLE");assert.equal(input.freeCF,"AVAILABLE");
 assert.equal(input.majorRisk,"UNVERIFIED");assert.equal(input.conditions.cashFlow.state,"UNVERIFIED");
 assert.equal(researchStatusForCompany(c).status,"STAY");assert.deepEqual(c,before);
 c.annual[0].debt.value=null;assert.equal(researchStatusForCompany(c).status,"GRAY");
 c.annual[0].debt.value=0;c.annual[0].operatingCF.value=null;
 assert.notEqual(researchStatusForCompany(c).status,"GREEN");
});
test("Service appends an independent status; exact canonical facts and all existing Evidence/calculations remain unchanged",async()=>{
 const c=company(),before=structuredClone(c),service=new AnalysisService({search:async()=>[c.identity],company:async()=>c});
 const result=await service.analyze("7203.JP");assert.equal(result.status,"ready");
 const {researchStatus,...report}=result.report;
 assert.deepEqual(report,buildReport(c,result.report.analyzedAt));assert.deepEqual(c,before);assert.equal(researchStatus.status,"STAY");
 const emerging=await service.analyze("7203.JP","EMERGING");
 assert.ok(emerging.report.researchStatus.ruleTrace.some(t=>t.ruleId==="R8"&&t.inputState==="UNVERIFIED"));
 assert.deepEqual((await service.watchlist([])).entries,[]);
 assert.equal((await service.watchlist(["7203.JP"])).entries[0].researchStatus.status,"STAY");
});
test("JPY display boundary: exact source remains intact; zero, signs, USD and UNKNOWN retained",()=>{
 for(const [value,expected]of [[616540000000,"6165億円"],[1398929000000,"1兆3989億円"],[3690071000000,"3兆6900億円"],[-221500000000,"-2215億円"],[0,"0円"]]){
  const row={value:new Intl.NumberFormat("ja-JP").format(value)+" JPY",currency:"JPY",unit:"currency",kind:"FACT"};
  const copy=structuredClone(row);assert.equal(publicValue(row),expected);assert.deepEqual(row,copy);
 }
 assert.equal(publicValue({value:"未取得",kind:"UNKNOWN",unit:"currency",currency:"JPY"}),"未取得");
 assert.equal(publicValue({value:"100 USD",kind:"FACT",unit:"currency",currency:"USD"}),"100 USD");
});
test("Public EDINET links use human browsing page; binary, ZIP and unsafe schemes never form href",()=>{
 for(const url of ["https://api.edinet-fsa.go.jp/api/v2/documents/S100TEST?type=1","https://disclosure2dl.edinet-fsa.go.jp/searchdocument/codelist/Edinetcode.zip","https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100TEST"])
 assert.equal(publicSourceUrl(url),"https://disclosure2.edinet-fsa.go.jp/");
 assert.equal(publicSourceUrl("javascript:alert(1)"),null);assert.equal(publicSourceUrl("https://example.invalid/file.zip"),null);
});

test("Canonical primary source absence, unresolved company or invalid annual date yields GRAY without a fallback",()=>{
 for(const alter of [c=>{c.filings=[];},c=>{c.identity.name="";},c=>{c.annual[0].end="";}]){
  const c=company();alter(c);assert.equal(researchStatusForCompany(c).status,"GRAY");
 }
});
test("Public requests cannot override R1-R10 with client condition/status fields; US remains disabled",async()=>{
 const {onRequest}=require("../../functions/api/stock-analysis/[[path]].ts");
 const before=global.fetch;let outbound=0;global.fetch=async()=>{outbound++;throw new Error("TEST DATA outbound prohibited");};
 try{
  const request=new Request("https://tutto.test/api/stock-analysis/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
   input:"NVDA",status:"GREEN",researchStatus:{status:"GREEN"},conditions:base().conditions,majorRisk:"CLEAR",
  })});
  const response=await onRequest({request,env:{STOCK_DATA_MODE:"FREE",SEC_LIVE_ENABLED:"false",STOCK_RATE_LIMITER:{limit:async()=>({success:true})}}});
  const result=await response.json();assert.equal(response.status,503);assert.equal(result.researchStatus.status,"GRAY");assert.ok(!result.report);assert.equal(outbound,0);
 }finally{global.fetch=before;}
});
