// Isolated TEST DATA only. Structured primary assertions below are synthetic, never a production fixture.
require("./register.cjs");
const {test}=require("node:test"),assert=require("node:assert/strict");
const E=require("../../server/stock-analysis/research-evidence/evaluators.ts");
const {normalizeFacts}=require("../../server/stock-analysis/research-evidence/model.ts");
const {adaptEvidence}=require("../../server/stock-analysis/research-evidence/adapter.ts");
const {evaluateResearchStatus}=require("../../lib/research-status.ts");
function bundle(){
 return {identity:{companyId:"E99999",securityCode:"999Z",symbol:"999Z.JP"},latestAnnual:{documentId:"S100TEST",fiscalPeriod:"2026-03-31",verified:true},
 documents:[{companyId:"E99999",securityCode:"999Z",documentId:"S100TEST",sourceType:"EDINET",url:"https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100TEST",
 fiscalPeriod:"2026-03-31",filingDate:"2026-06-24",retrievedAt:"2026-10-01T00:00:00Z",parserVersion:"TEST DATA/1",fragments:[]}]};
}
function fact(b,id,kind,fields,doc=0){
 b.documents[doc].fragments.push({id,kind,fields,heading:"TEST DATA structured primary section",location:"TEST DATA/"+id,structure:"EXPLICIT_PRIMARY_STRUCTURE",confidence:"CONFIRMED"});
 return id;
}
function business(){
 const b=bundle();fact(b,"scope","BusinessScope",{businessIds:["main"],complete:true});
 fact(b,"main","BusinessUnit",{businessId:"main",name:"TEST DATA main business"});
 fact(b,"product","ProductOrService",{name:"TEST DATA product"});fact(b,"customer","CustomerOrMarket",{name:"TEST DATA customer market"});
 fact(b,"revenue","RevenueSource",{name:"TEST DATA contractual sales"});fact(b,"profit","ProfitDriver",{name:"TEST DATA profit mechanism"});
 fact(b,"chain","SegmentRelation",{businessId:"main",product:"product",customer:"customer",revenue:"revenue",profit:"profit",explicit:true});return b;
}
function cash(){
 const b=bundle(),periods=["2024-03-31","2025-03-31","2026-03-31"];
 for(const [i,period]of periods.entries())for(const [kind,value]of [["NetIncome",100+i*10],["OperatingCashFlow",120+i*10],["Capex",30],["FreeCashFlow",90+i*10]])
 fact(b,kind+period,kind,{value,period,currency:"JPY",basis:"annual",start:period.slice(0,4)-1+"-04-01"});
 fact(b,"cf-explanation","CashFlowExplanation",{periods,cashConversion:"CONTINUING",deterioration:"NONE"});
 fact(b,"oneoff","OneOffFact",{periods,role:"NOT_SOLE_DRIVER"});return b;
}
function risks(){
 const b=bundle();fact(b,"risk-scope","RiskScope",{riskIds:["issue"],complete:true});
 fact(b,"risk","RiskFact",{riskId:"issue",category:"TEST DATA funding",state:"MITIGATED",materiality:"MAJOR",materialityBasis:"TEST DATA primary major business risk"});
 fact(b,"impact","CurrentImpact",{riskId:"issue",state:"NON_MATERIAL"});
 fact(b,"response","CompanyResponse",{riskId:"issue",state:"IMPLEMENTED"});
 fact(b,"effective","MitigationEvidence",{riskId:"issue",effect:"EFFECTIVE"});return b;
}
function counter(){
 const b=bundle();fact(b,"thesis","PrimaryThesisFact",{thesisId:"growth",claim:"TEST DATA company-specific conversion of demand"});
 fact(b,"counter","CounterThesisFact",{counterId:"demand-reversal",claim:"TEST DATA company-specific contrary demand evidence"});
 fact(b,"relation","ThesisRelation",{primary:"thesis",counter:"counter",relation:"WEAKENS",coreImpact:"NONE",materiality:"MAJOR",materialityBasis:"TEST DATA primary causal chain"});
 fact(b,"review","CounterEvidenceState",{counter:"counter",state:"NOT_MATERIALIZED"});return b;
}
function change(b,kind,patch){Object.assign(b.documents[0].fragments.find(f=>f.kind===kind).fields,patch);return b;}
test("R11 source-bound complete product/customer/revenue/profit relation -> MET",()=>assert.equal(E.evaluateBusinessUnderstanding(business()).status,"MET"));
test("R11 established main relation with only minor missing -> PARTIAL",()=>{
 const b=business();fact(b,"minor","MinorDetailGap",{items:["TEST DATA regional detail"]});assert.equal(E.evaluateBusinessUnderstanding(b).status,"PARTIAL");
});
test("R11 heading/text/product list alone -> UNVERIFIED",()=>{
 const b=bundle();b.documents[0].fragments.push({id:"text",kind:null,text:"TEST DATA business/product/risk/mitigation words",heading:"事業の内容",location:"body",structure:"TEXT_ONLY",confidence:"CONFIRMED"});
 assert.equal(E.evaluateBusinessUnderstanding(b).status,"UNVERIFIED");assert.equal(normalizeFacts(b).facts.length,0);
});
test("R11 missing profit link cannot be a business proof",()=>{
 const b=business();b.documents[0].fragments=b.documents[0].fragments.filter(f=>f.kind!=="ProfitDriver");assert.equal(E.evaluateBusinessUnderstanding(b).status,"UNVERIFIED");
});
test("R11 formal main structural contradiction -> NOT_MET",()=>{
 const b=business();fact(b,"failure","BusinessFailure",{businessId:"main",state:"CONTRADICTION",materiality:"MAJOR",basis:"TEST DATA explicit core structure failure"});
 assert.equal(E.evaluateBusinessUnderstanding(b).status,"NOT_MET");
});
test("R11 conflicting scope must not select one side",()=>{
 const b=business();fact(b,"scope2","BusinessScope",{businessIds:["other"],complete:true});assert.equal(E.evaluateBusinessUnderstanding(b).status,"UNVERIFIED");
});
test("R12 three periods + explicit conversion/one-off relation -> MET",()=>assert.equal(E.evaluateCashFlowSustainability(cash()).status,"MET"));
test("R12 three positive periods alone -> UNVERIFIED",()=>{
 const b=cash();b.documents[0].fragments=b.documents[0].fragments.filter(f=>!["CashFlowExplanation","OneOffFact"].includes(f.kind));
 assert.equal(E.evaluateCashFlowSustainability(b).status,"UNVERIFIED");
});
test("R12 explicit persistent conversion failure -> NOT_MET",()=>assert.equal(E.evaluateCashFlowSustainability(change(cash(),"CashFlowExplanation",{cashConversion:"PERSISTENT_FAILURE"})).status,"NOT_MET"));
test("R12 unexplained one-off cannot be inferred absent",()=>assert.equal(E.evaluateCashFlowSustainability(change(cash(),"OneOffFact",{role:"UNVERIFIED"})).status,"UNVERIFIED"));
test("R12 one period positive remains UNVERIFIED even with an explanation",()=>{
 const b=cash();b.documents[0].fragments=b.documents[0].fragments.filter(f=>!f.fields.period||f.fields.period==="2026-03-31");
 assert.equal(E.evaluateCashFlowSustainability(b).status,"UNVERIFIED");
});
test("R12 missing OCF or FCF, mixed currency and year gaps fail closed",()=>{
 for(const patch of ["OperatingCashFlow","FreeCashFlow","currency","gap"]){
 const b=cash();if(["OperatingCashFlow","FreeCashFlow"].includes(patch))b.documents[0].fragments=b.documents[0].fragments.filter(f=>f.kind!==patch);
 else if(patch==="currency")b.documents[0].fragments.find(f=>f.fields.period==="2024-03-31").fields.currency="USD";
 else b.documents[0].fragments.forEach(f=>{if(f.fields.period==="2024-03-31")f.fields.period="2020-03-31";});
 assert.equal(E.evaluateCashFlowSustainability(b).status,"UNVERIFIED");
 }
});
test("R12 formal persistent non-transient deterioration -> NOT_MET",()=>{
 const b=change(cash(),"CashFlowExplanation",{deterioration:"PERSISTENT"});change(b,"OneOffFact",{role:"NOT_SOLE_DRIVER"});
 assert.equal(E.evaluateCashFlowSustainability(b).status,"NOT_MET");
});
test("R13 source-bound impact and effective mitigation -> MET",()=>assert.equal(E.evaluateMajorRisk(risks()).status,"MET"));
test("R13 response wording without effectiveness -> UNVERIFIED",()=>{
 const b=risks();b.documents[0].fragments=b.documents[0].fragments.filter(f=>f.kind!=="MitigationEvidence");assert.equal(E.evaluateMajorRisk(b).status,"UNVERIFIED");
});
test("R13 Debt and risk-section presence alone are insufficient",()=>{
 const b=bundle();fact(b,"debt","Debt",{value:100,period:"2026-03-31",currency:"JPY",basis:"annual"});
 assert.equal(E.evaluateMajorRisk(b).status,"UNVERIFIED");
});
test("R13 material ACTIVE risk with explicit no response -> NOT_MET",()=>{
 const b=change(risks(),"RiskFact",{state:"ACTIVE"});change(b,"CurrentImpact",{state:"MATERIAL"});change(b,"CompanyResponse",{state:"NONE"});
 b.documents[0].fragments=b.documents[0].fragments.filter(f=>f.kind!=="MitigationEvidence");assert.equal(E.evaluateMajorRisk(b).status,"NOT_MET");
});
test("R13 historical risk may resolve only through later primary evidence",()=>{
 const b=risks();change(b,"RiskFact",{state:"ACTIVE"});
 b.documents.push({...b.documents[0],documentId:"S100NEXT",url:"https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100NEXT",filingDate:"2026-07-01",fragments:[]});
 fact(b,"resolved","ResolutionEvidence",{riskId:"issue",previous:"risk",state:"ENDED"},1);
 assert.equal(E.evaluateMajorRisk(b).status,"MET");
 b.documents[1].filingDate="2026-06-01";assert.equal(E.evaluateMajorRisk(b).status,"UNVERIFIED");
});
test("R13 disappearing risk description does not prove resolved",()=>assert.equal(E.evaluateMajorRisk(bundle()).status,"UNVERIFIED"));
test("R14 company-specific thesis/counter relation with current review -> MET",()=>assert.equal(E.evaluateCounterThesis(counter()).status,"MET"));
test("R14 generic template without formal relation -> UNVERIFIED",()=>{
 const b=bundle();b.documents[0].fragments.push({id:"template",kind:null,text:"TEST DATA AI demand may be temporary",heading:"Risk",location:"body",structure:"TEXT_ONLY",confidence:"CONFIRMED"});
 assert.equal(E.evaluateCounterThesis(b).status,"UNVERIFIED");
});
test("R14 explicit active major destruction of core thesis -> NOT_MET",()=>{
 const b=change(counter(),"ThesisRelation",{relation:"CONTRADICTS",coreImpact:"DESTROYS"});change(b,"CounterEvidenceState",{state:"ACTIVE"});
 assert.equal(E.evaluateCounterThesis(b).status,"NOT_MET");
});
test("R14 no negative evidence cannot be cleared",()=>assert.equal(E.evaluateCounterThesis(bundle()).status,"UNVERIFIED"));
test("R14 unresolved counter status and missing materiality remain UNVERIFIED",()=>{
 assert.equal(E.evaluateCounterThesis(change(counter(),"CounterEvidenceState",{state:"UNVERIFIED"})).status,"UNVERIFIED");
 assert.equal(E.evaluateCounterThesis(change(counter(),"ThesisRelation",{materiality:"UNKNOWN"})).status,"UNVERIFIED");
});
test("All four gates reject other-company, unverified annual and stale source metadata",()=>{
 for(const create of [business,cash,risks,counter])for(const variant of ["company","code","annual","stale","confidence","source"]){
 const b=create();if(variant==="company")b.documents[0].companyId="E00000";if(variant==="code")b.documents[0].securityCode="0000";
 if(variant==="annual")b.latestAnnual.verified=false;if(variant==="stale")b.latestAnnual.fiscalPeriod="2027-03-31";
 if(variant==="confidence")b.documents[0].fragments.forEach(f=>f.confidence="UNVERIFIED");
 if(variant==="source")b.documents[0].sourceType="BLOG";
 for(const evaluate of [E.evaluateBusinessUnderstanding,E.evaluateCashFlowSustainability,E.evaluateMajorRisk,E.evaluateCounterThesis])assert.equal(evaluate(b).status,"UNVERIFIED");
 }
});
test("Evidence output preserves source identity/period/location and does not mutate input",()=>{
 const b=business(),before=structuredClone(b),r=E.evaluateBusinessUnderstanding(b);assert.deepEqual(b,before);
 assert.ok(r.evidenceRefs.length);assert.ok(r.predicateTrace.every(p=>p.factRefs.length&&p.relationRefs.length));
 const n=normalizeFacts(b);for(const f of n.facts)for(const field of ["companyId","securityCode","documentId","sourceType","sourceHeading","sourceLocation","fiscalPeriod","filingDate","retrievedAt","ruleVersion","parserVersion","confidence"])assert.ok(f.metadata[field]);
});
function input(){const c=()=>({state:"MET",reason:"TEST DATA old formal input",evidenceRefs:["TEST DATA"]});return {
 provider:"READY",identity:"VERIFIED",latestAnnual:"AVAILABLE",primaryEvidence:"AVAILABLE",dataIntegrity:"VALID",debt:"AVAILABLE",operatingCF:"AVAILABLE",freeCF:"AVAILABLE",cashFlowMissingSeverity:"NOT_MAJOR",
 majorRisk:"CLEAR",counterThesisMajorRisk:"CLEAR",valuation:"MISSING",growthMode:"STANDARD",sourceFiscalYear:"2026-03-31",ownerDecisionsRequired:[],
 conditions:Object.fromEntries(["business","financials","cashFlow","balanceSheet","risk","counterThesis","valuation","growth"].map(k=>[k,c()]))};}
test("Adapter preserves R1-R10 precedence, valuation-only STAY and literal PARTIAL allowance",()=>{
 const r={business:E.evaluateBusinessUnderstanding(business()),cashFlowSustainability:E.evaluateCashFlowSustainability(cash()),majorRisk:E.evaluateMajorRisk(risks()),counterThesis:E.evaluateCounterThesis(counter())};
 const old=input(),copy=structuredClone(old);assert.equal(evaluateResearchStatus(adaptEvidence(old,r)).status,"STAY");assert.deepEqual(old,copy);
 const b=business();fact(b,"minor","MinorDetailGap",{items:["TEST DATA"]});r.business=E.evaluateBusinessUnderstanding(b);
 assert.equal(adaptEvidence(old,r).conditions.business.state,"MET");
 r.majorRisk=E.evaluateMajorRisk(change(risks(),"RiskFact",{state:"ACTIVE"}));assert.notEqual(evaluateResearchStatus(adaptEvidence(old,r)).status,"GREEN");
 const debt={...old,debt:"MISSING"};assert.equal(evaluateResearchStatus(adaptEvidence(debt,r)).status,"GRAY");
});


const {extractBoundedSections}=require("../../server/stock-analysis/research-evidence/extraction.ts");
function xml(prefix="jpcrp",issuer="E99999",uri="http://disclosure.edinet-fsa.go.jp/taxonomy/jpcrp/2026-01-01"){
 return `<xbrli:xbrl xmlns:${prefix}="${uri}"><xbrli:context id="CurrentYearDuration"><xbrli:entity><xbrli:identifier>${issuer}</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:startDate>2025-04-01</xbrli:startDate><xbrli:endDate>2026-03-31</xbrli:endDate></xbrli:period></xbrli:context><${prefix}:DescriptionOfBusinessTextBlock contextRef="CurrentYearDuration">&lt;p&gt;TEST DATA product business risk mitigated&lt;/p&gt;</${prefix}:DescriptionOfBusinessTextBlock></xbrli:xbrl>`;
}
test("Bounded extraction retains heading/context/issuer but never creates semantic facts",()=>{
 const result=extractBoundedSections(xml());assert.equal(result.length,1);assert.equal(result[0].companyId,"E99999");assert.equal(result[0].kind,null);assert.equal(result[0].structure,"TEXT_ONLY");
 assert.ok(result[0].text.includes("TEST DATA"));assert.ok(result[0].location.includes("CurrentYearDuration"));
});
test("Bounded extraction rejects DTD, unsupported taxonomy and nonexistent contexts",()=>{
 assert.throws(()=>extractBoundedSections("<!DOCTYPE x>"+xml()));
 assert.equal(extractBoundedSections(xml("fake","E99999","https://third-party.example/taxonomy")).length,0);
 assert.equal(extractBoundedSections(xml().replace('contextRef="CurrentYearDuration"','contextRef="other"')).length,0);
});


test("R13 conflicting explicit no-response and effective mitigation are not silently resolved",()=>{
 const b=change(risks(),"RiskFact",{state:"ACTIVE"});change(b,"CurrentImpact",{state:"MATERIAL"});change(b,"CompanyResponse",{state:"NONE"});
 assert.equal(E.evaluateMajorRisk(b).status,"UNVERIFIED");
});
test("R14 a known primary thesis without a reviewed counter blocks completion",()=>{
 const b=counter();fact(b,"other-primary","PrimaryThesisFact",{thesisId:"other",claim:"TEST DATA another main company causal thesis"});
 assert.equal(E.evaluateCounterThesis(b).status,"UNVERIFIED");
});


const {EvidenceCollector,bundleFromCompany}=require("../../server/stock-analysis/research-evidence/extraction.ts");
const {evaluateResearchEvidence}=E;
const {emptyPeriod,emptyValuation}=require("../../server/stock-analysis/primary-model.ts");
const {AnalysisService}=require("../../server/stock-analysis/service.ts");
function canonicalCompany(){
 const identity={symbol:"999Z.JP",code:"999Z",exchange:"JP",name:"TEST DATA company",country:"Japan",currency:"JPY",edinetCode:"E99999"};
 const source={provider:"EDINET",url:"https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100TEST",title:"TEST DATA primary",retrievedAt:"2026-10-01T00:00:00Z",asOf:"2026-06-24",
 field:"TEST DATA concept",basis:"annual",period:"2026-03-31",currency:"JPY",unit:"currency",filingDate:"2026-06-24",classification:"FACT",form:"120",accession:"S100TEST",start:"2025-04-01"};
 const annual=["2026-03-31","2025-03-31","2024-03-31"].map(end=>{
 const s={...source,period:end,start:Number(end.slice(0,4))-1+"-04-01"},p=emptyPeriod(end,"annual","JPY",s);
 for(const [field,value]of [["netIncome",100],["operatingCF",120],["capex",30],["revenue",200],["debt",50],["equity",100]])p[field]={value,source:{...s,field}};return p;});
 return {provider:"EDINET",mode:"FREE",valuationStatus:"LIMITED",identity,primarySource:source,filings:[{url:source.url,title:source.title,filed:source.filingDate,period:"2026-03-31",amended:false}],
 annual,quarterly:[],semiAnnual:[],description:null,sector:null,industry:null,website:null,cik:null,updatedAt:source.asOf,retrievedAt:source.retrievedAt,
 quote:null,valuation:emptyValuation(source),earnings:[],issues:[]};
}
test("Canonical facts retain all original values/timestamps and never imply sustainable CF",()=>{
 const c=canonicalCompany(),copy=structuredClone(c),b=bundleFromCompany(c),n=normalizeFacts(b);assert.equal(n.facts.length,12);assert.deepEqual(c,copy);
 assert.equal(n.facts.find(f=>f.kind==="FreeCashFlow").fields.value,90);assert.equal(n.facts[0].metadata.retrievedAt,c.annual[0].netIncome.source.retrievedAt);
 for(const r of Object.values(evaluateResearchEvidence(b)).filter(v=>v&&typeof v==="object"&&"status"in v))assert.equal(r.status,"UNVERIFIED");
});
test("Collector never retries, never consumes original response, and a missing source remains unknown",async()=>{
 let calls=0;const collector=new EvidenceCollector(),original=new Response(new Uint8Array([1,2,3]));
 const fetcher=collector.wrap(async()=>{calls++;return original;});
 const response=await fetcher("https://api.edinet-fsa.go.jp/api/v2/documents/S100TEST?type=1&Subscription-Key=TEST-DATA-SECRET");
 assert.equal(calls,1);assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[1,2,3]);
 assert.equal(evaluateResearchEvidence(collector.bundle(canonicalCompany())).business.status,"UNVERIFIED");
});
test("Service adapter keeps original CompanyData, financial Evidence, Debt and final Research Status",async()=>{
 const c=canonicalCompany(),before=structuredClone(c),provider={search:async()=>[c.identity],company:async()=>c};
 const old=await new AnalysisService(provider).analyze("999Z.JP"),next=await new AnalysisService(provider,bundleFromCompany).analyze("999Z.JP");
 assert.equal(next.status,"ready");assert.deepEqual(next.report.sections,old.report.sections);assert.deepEqual(c,before);
 assert.equal(next.report.researchStatus.status,old.report.researchStatus.status);assert.equal(next.report.researchStatus.dataCompleteness.debt,"AVAILABLE");
 assert.equal(next.report.researchEvidence.business.status,"UNVERIFIED");assert.equal(next.report.researchEvidence.sourceCandidates,0);
});


test("Oversized mirror cancels independently and returns the original financial response",async()=>{
 const size=21*1024*1024,original=new Response(new Uint8Array(size)),collector=new EvidenceCollector();
 const request=collector.wrap(async()=>original)("https://api.edinet-fsa.go.jp/api/v2/documents/S100TEST?type=1");
 let timer;const response=await Promise.race([request,new Promise(resolve=>{timer=setTimeout(()=>resolve(null),2000);})]);clearTimeout(timer);
 if(!response)await original.arrayBuffer(); // release the tee before reporting a regression
 assert.ok(response,"Evidence mirror must not wait for cancellation of the unread original branch");
 assert.equal((await response.arrayBuffer()).byteLength,size);
});


test("R12 distinguishes proven three-period numeric relation from missing qualitative explanation",()=>{
 const b=cash();b.documents[0].fragments=b.documents[0].fragments.filter(f=>!["CashFlowExplanation","OneOffFact"].includes(f.kind));
 const r=E.evaluateCashFlowSustainability(b);assert.equal(r.periodsReviewed.length,3);
 assert.ok(!r.missingItems.some(v=>v.includes("最低3年")),"Available numeric periods must not be reported as missing");
 assert.ok(r.missingItems.some(v=>v.includes("CashFlowExplanation")));
});


test("R13 RESOLVED state label without later ResolutionEvidence remains UNVERIFIED",()=>{
 const b=change(risks(),"RiskFact",{state:"RESOLVED"});assert.equal(E.evaluateMajorRisk(b).status,"UNVERIFIED");
});


test("FilingDateInstant business source is bound to exact official filing, never to a guessed fiscal context",()=>{
 const company=canonicalCompany();
 const filingXml=xml().replace(/CurrentYearDuration/g,"FilingDateInstant").replace("<xbrli:startDate>2025-04-01</xbrli:startDate><xbrli:endDate>2026-03-31</xbrli:endDate>","<xbrli:instant>2026-06-24</xbrli:instant>");
 const blocks=extractBoundedSections(filingXml);
 const captured=new Map([["S100TEST",{blocks,retrievedAt:company.retrievedAt}]]);
 const b=bundleFromCompany(company,captured);
 assert.equal(b.documents[0].fragments.filter(f=>f.structure==="TEXT_ONLY").length,1);
 assert.equal(normalizeFacts(b).facts.filter(f=>f.kind==="BusinessUnit").length,0);
 assert.equal(E.evaluateBusinessUnderstanding(b).status,"UNVERIFIED");
 for(const patch of [{period:"2026-06-23"},{companyId:"E00001"},{contextRef:"OtherInstant"}]){
  const wrong=new Map([["S100TEST",{blocks:blocks.map(v=>({...v,...patch})),retrievedAt:company.retrievedAt}]]);
  assert.equal(bundleFromCompany(company,wrong).documents[0].fragments.filter(f=>f.structure==="TEXT_ONLY").length,0);
 }
});

test("Filing-date narrative is current annual evidence only, never an older interim filing with the annual year-end label",()=>{
 const company=canonicalCompany();
 const filingXml=xml().replace(/CurrentYearDuration/g,"FilingDateInstant").replace("<xbrli:startDate>2025-04-01</xbrli:startDate><xbrli:endDate>2026-03-31</xbrli:endDate>","<xbrli:instant>2025-11-13</xbrli:instant>");
 company.filings.push({...company.filings[0],url:"https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100OTHR",filed:"2025-11-13"});
 const b=bundleFromCompany(company,new Map([["S100OTHR",{blocks:extractBoundedSections(filingXml),retrievedAt:company.retrievedAt}]]));
 assert.equal(b.documents.find(d=>d.documentId==="S100OTHR").fragments.filter(f=>f.structure==="TEXT_ONLY").length,0);
});
