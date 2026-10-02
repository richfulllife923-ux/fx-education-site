// TEST DATA only. Never imported by production or bounded live scanner.
require("./register.cjs");
const {test}=require("node:test"),assert=require("node:assert/strict");
const {evaluateRadar,publicCandidates}=require("../../server/stock-analysis/growth-radar/engine.ts");
const {deepResearchRequest,top3FromRadar}=require("../../server/stock-analysis/growth-radar/adapter.ts");
function input(text,extra={}){
 const identity={companyId:"E99999",securityCode:"999Z",name:"TEST DATA"};
 return {identity,identityVerified:true,evaluationPeriod:"2026-03-31",latestDocumentIds:["S100TEST"],evaluatedAt:"2026-10-02T00:00:00Z",
  sources:[{id:"s1",...identity,documentId:"S100TEST",sourceType:"EDINET",
   url:"https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100TEST",
   period:"2026-03-31",filingDate:"2026-06-24",retrievedAt:"2026-10-02T00:00:00Z",
   heading:"経営成績の分析",location:"TEXT DATA/current",format:"TEXT",primaryVerified:true,text}],...extra};
}
const run=(text,extra)=>evaluateRadar(input(text,extra));
const positive="データセンター需要の増加により、SSD売上が増加した。";
test("01 revenue change alone remains CHANGE_SIGNAL",()=>assert.equal(run("売上高は前年同期比で増加した。").state,"CHANGE_SIGNAL"));
test("02 customer and revenue without relation remain VERIFYING",()=>assert.equal(run("当期は新規顧客Aへの供給を開始した。売上高は前年同期比で増加した。").state,"VERIFYING"));
test("03 explicitly attributed customer contribution qualifies",()=>assert.equal(run("New customer acquisition contributed to revenue growth.").state,"CANDIDATE"));
test("04 capacity plus revenue co-movement never promotes",()=>assert.notEqual(run("生産能力が拡大した。売上高が増加した。").state,"CANDIDATE"));
test("05 increased production explicitly enabled revenue qualifies",()=>assert.equal(run("Increased production enabled revenue growth.").state,"CANDIDATE"));
test("06 three years of revenue never prove continuity",()=>{
 const r=run("売上高が増加した。", {numericHistoryYears:3});assert.equal(r.continuity,"UNVERIFIED");assert.notEqual(r.state,"CANDIDATE");
});
test("07 revenue profit CF series without attribution never qualifies",()=>assert.notEqual(run("売上高が増加した。営業利益が増加した。営業CFが増加した。",{numericHistoryYears:3}).state,"CANDIDATE"));
test("08 same sentence binds exact trigger and effect and provenance",()=>{
 const i=input(positive),r=evaluateRadar(i);assert.equal(r.state,"CANDIDATE");assert.equal(r.structuralChange,"YES");
 assert.equal(r.continuity,"UNVERIFIED");const w=r.whyNow[0],rel=r.relations.find(v=>v.id===w.relationId);
 assert.equal(rel.provenance,"MANAGEMENT_ATTRIBUTED");assert.equal(w.sourcePeriod,i.evaluationPeriod);
 for(const id of [w.triggerFactId,w.effectFactId]){const f=r.facts.find(v=>v.id===id);assert.equal(i.sources[0].text.slice(f.span.start,f.span.end),f.quote);}
});
test("09 explicit adjacent reference binds preceding sentence",()=>assert.equal(run("当期は新規顧客Aへの供給を開始した。この結果、売上高は前年同期比で増加した。").state,"CANDIDATE"));
test("10 adjacency without explicit reference does not bind",()=>assert.equal(run("新規顧客への供給を開始した。売上高が増加した。").whyNow.length,0));
test("11 negation cannot become positive relation",()=>assert.notEqual(run("売上高が増加したが、需要増加によるものではない。").state,"CANDIDATE"));
test("12 conditional future is not observed relation",()=>assert.notEqual(run("需要が増加すれば売上増が期待される。").state,"CANDIDATE"));
test("13 table co-movement does not create causality",()=>{const i=input(positive);i.sources[0].format="TABLE";assert.equal(evaluateRadar(i).whyNow.length,0);});
test("14 old historical relation never supplies current Why Now",()=>{const i=input(positive);i.sources[0].documentId="S100OLDX";i.sources[0].url="https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100OLDX";assert.notEqual(evaluateRadar(i).state,"CANDIDATE");});
test("15 issuer mismatch fails closed",()=>{const i=input(positive);i.sources[0].companyId="E88888";assert.notEqual(evaluateRadar(i).state,"CANDIDATE");});
test("16 period conflict is UNVERIFIED",()=>{const i=input(positive);i.sources[0].period="2025-03-31";const r=evaluateRadar(i);assert.equal(r.structuralChange,"UNVERIFIED");assert.equal(r.whyNow.length,0);});
test("17 zero candidates is valid",()=>assert.deepEqual(publicCandidates([]).entries,[]));
test("18 no padding when two qualify",()=>{const r=run(positive),r2=run(positive);r2.identity={...r.identity,companyId:"E88888",securityCode:"888Z"};assert.equal(publicCandidates([r,r2]).entries.length,2);});
test("price, cap, volume, AI keyword alone cannot qualify",()=>{for(const text of ["株価が上昇した。","時価総額が増加した。","売買高が増加した。","AI 半導体 成長市場。"])assert.notEqual(run(text).state,"CANDIDATE");});
test("missing primary verification and third-party URLs fail closed",()=>{
 for(const change of [{primaryVerified:false},{url:"https://blog.example/test"},{url:"https://api.edinet-fsa.go.jp/api/v2/documents/S100TEST?Subscription-Key=secret"}]){
 const i=input(positive);Object.assign(i.sources[0],change);assert.equal(evaluateRadar(i).whyNow.length,0);}
});
test("same-layer wording cannot create structural change",()=>assert.notEqual(run("売上高の増加により、収益が増加した。").state,"CANDIDATE"));
test("connector hit without clear economic subject does not qualify",()=>assert.notEqual(run("この取り組みにより、売上高が増加した。").state,"CANDIDATE"));
test("unresolved source conflict blocks promotion",()=>assert.notEqual(run(positive,{conflicts:["PRIMARY_SOURCE_CONFLICT"]}).state,"CANDIDATE"));
test("duplicate source does not multiply facts, relations or candidates",()=>{const i=input(positive),r=evaluateRadar(i);i.sources.push(structuredClone(i.sources[0]));const d=evaluateRadar(i);assert.equal(d.facts.length,r.facts.length);assert.equal(d.whyNow.length,r.whyNow.length);assert.equal(publicCandidates([r,r]).entries.length,1);});
test("ambiguous multiple causal subjects fail closed",()=>assert.notEqual(run("需要増加と為替変動により、売上高が増加した。").state,"CANDIDATE"));
test("forecast and possibility remain unverified",()=>{for(const text of ["需要増加により、売上高が増加する見込み。","Demand growth may drive revenue growth.","Revenue growth is expected due to demand growth."])assert.notEqual(run(text).state,"CANDIDATE");});
test("initial candidate is independent of unavailable valuation/qualitative gates",()=>assert.equal(run(positive,{researchStatus:"GRAY",valuation:"LIMITED",summaryScore:null}).state,"CANDIDATE"));
test("deep research requires current lawful candidate and preserves formal input",()=>{const r=run(positive);assert.equal(deepResearchRequest(r).state,"DEEP_RESEARCH");assert.equal(deepResearchRequest(run("売上高が増加した。")),null);assert.ok(deepResearchRequest(r).requiredReviews.includes("Counter-Thesis"));});
test("Top3 adapter never alters complete/current/audits or bypasses S1-S7",()=>{
 const selection={universe:[],audits:[],comparisons:[],manifest:{remainingUnknowns:[],coverage:{}},complete:false,current:true};
 const before=structuredClone(selection),r=top3FromRadar([run(positive)],selection);
 assert.equal(r.state,"IN_PROGRESS");assert.deepEqual(selection,before);assert.equal(r.entries.length,0);
});
test("more than ten candidates is withheld without invented ranking",()=>{const rows=Array.from({length:11},(_,i)=>({...run(positive),identity:{companyId:"E"+String(10000+i),securityCode:String(1000+i)}}));const r=publicCandidates(rows);assert.equal(r.entries.length,0);assert.equal(r.state,"COMPARISON_REQUIRED");});
test("source identifiers duplicated with contradictory payload fail closed",()=>{const i=input(positive);i.sources.push({...i.sources[0],text:"売上高が減少した。"});assert.equal(evaluateRadar(i).whyNow.length,0);});
test("local source metadata missing never promotes",()=>{for(const key of ["heading","location","filingDate","retrievedAt"]){const i=input(positive);i.sources[0][key]="";assert.equal(evaluateRadar(i).whyNow.length,0);}});
