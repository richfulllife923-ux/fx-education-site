// TEST DATA ONLY: isolated synthetic API/XML fixtures, never imported by runtime code.
require("./register.cjs");
const {test}=require("node:test"),assert=require("node:assert/strict"),zlib=require("node:zlib");
const {PrimaryHttp}=require("../../server/stock-analysis/primary-http.ts");
const {normalizeSecFacts,SecProvider}=require("../../server/stock-analysis/sec.ts");
const {normalizeEdinetXbrl}=require("../../server/stock-analysis/edinet-xbrl.ts");
const {EdinetProvider,mergeEdinetRows}=require("../../server/stock-analysis/edinet.ts");
const {FreeProvider}=require("../../server/stock-analysis/free.ts");
const {resolveSymbol}=require("../../server/stock-analysis/resolver.ts");
const {freeCashFlow}=require("../../server/stock-analysis/calculations.ts");
const {buildReport}=require("../../server/stock-analysis/engine.ts");
const {readZip}=require("../../server/stock-analysis/zip.ts");
const {onRequest}=require("../../functions/api/stock-analysis/[[path]].ts");
const now=()=>new Date("2026-10-01T00:00:00Z"),retrieved=now().toISOString();
const accn="0001045810-26-000001",email="test-contact@example.invalid";
const fact=(value,start="2025-01-01",end="2025-12-31",more={})=>({val:value,start,end,filed:"2026-02-01",accn,form:"10-K",...more});
const facts=()=>({cik:1045810,facts:{"us-gaap":{
 Revenues:{units:{USD:[fact(100)]}},OperatingIncomeLoss:{units:{USD:[fact(20)]}},
 NetIncomeLoss:{units:{USD:[fact(10)]}},NetCashProvidedByUsedInOperatingActivities:{units:{USD:[fact(30)]}},
 PaymentsToAcquireProductiveAssets:{units:{USD:[fact(5)]}},Assets:{units:{USD:[fact(80,undefined,undefined,{start:undefined})]}},
 EarningsPerShareDiluted:{units:{"USD/shares":[fact(1)]}}
}}});
const filing={docID:"S100TEST",edinetCode:"E02144",secCode:"72030",filerName:"Toyota [TEST DATA]",docTypeCode:"120",
 periodStart:"2024-04-01",periodEnd:"2025-03-31",submitDateTime:"2025-06-25 09:00",parentDocID:null,xbrlFlag:"1",withdrawalStatus:"0",disclosureStatus:"0"};
function xml({start="2024-04-01",end="2025-03-31",entity="E02144-000",dimension="",extra="",currency="JPY",prefix="jppfs_cor"}={}) {
 const context=(id,period)=>'<xbrli:context id="'+id+'"><xbrli:entity><xbrli:identifier scheme="http://disclosure.edinet-fsa.go.jp">'+entity+'</xbrli:identifier></xbrli:entity><xbrli:period>'+period+'</xbrli:period>'+dimension+'</xbrli:context>';
 const numeric=(name,value,context="annual",unit="yen")=>"<"+prefix+":"+name+' contextRef="'+context+'" unitRef="'+unit+'" decimals="-6">'+value+"</"+prefix+":"+name+">";
 return '<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance" xmlns:jppfs_cor="http://disclosure.edinet-fsa.go.jp/taxonomy/jppfs/2025-11-01/jppfs_cor" xmlns:custom="https://example.invalid/company">'+
 context("annual","<xbrli:startDate>"+start+"</xbrli:startDate><xbrli:endDate>"+end+"</xbrli:endDate>")+
 context("instant","<xbrli:instant>"+end+"</xbrli:instant>")+
 '<xbrli:unit id="yen"><xbrli:measure>iso4217:'+currency+'</xbrli:measure></xbrli:unit>'+
 numeric("NetSales","100000000")+numeric("OperatingIncome","20000000")+numeric("NetIncomeLoss","10000000")+
 numeric("NetCashProvidedByUsedInOperatingActivities","30000000")+numeric("PurchaseOfPropertyPlantAndEquipmentInvCF","-5000000")+
 numeric("Assets","80000000","instant")+extra+"</xbrli:xbrl>";
}
function crc(bytes){let value=0xffffffff;for(const byte of bytes){value^=byte;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0);}return(value^0xffffffff)>>>0;}
function zipXml(text,name="XBRL/PublicDoc/test.xbrl"){
 const data=Buffer.from(text),compressed=zlib.deflateRawSync(data),filename=Buffer.from(name),local=Buffer.alloc(30),central=Buffer.alloc(46),end=Buffer.alloc(22);
 local.writeUInt32LE(0x04034b50);local.writeUInt16LE(8,8);local.writeUInt32LE(crc(data),14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(filename.length,26);
 central.writeUInt32LE(0x02014b50);central.writeUInt16LE(8,10);central.writeUInt32LE(crc(data),16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(filename.length,28);
 end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(central.length+filename.length,12);end.writeUInt32LE(local.length+filename.length+compressed.length,16);
 return Buffer.concat([local,filename,compressed,central,filename,end]);
}
const response=data=>new Response(JSON.stringify(data),{headers:{"Content-Type":"application/json"}});
test("SEC annual versus quarter/YTD, units, source FACT, EPS and no guessed debt",()=>{
 const raw=facts();raw.facts["us-gaap"].Revenues.units.USD.push(fact(40,"2026-01-01","2026-03-31",{form:"10-Q",filed:"2026-05-01"}),fact(80,"2026-01-01","2026-06-30",{form:"10-Q",filed:"2026-08-01"}));
 const data=normalizeSecFacts(raw,"0001045810",retrieved,"2026-10-01");
 assert.equal(data.annual.length,1);assert.equal(data.quarterly.length,1);assert.equal(data.annual[0].revenue.value,100);
 assert.equal(data.annual[0].assets.value,80);assert.equal(data.annual[0].eps.value,1);assert.equal(data.annual[0].debt.value,null);
 assert.equal(freeCashFlow(data.annual[0]).value,25);assert.equal(data.annual[0].revenue.source.classification,"FACT");
 assert.ok(data.annual[0].revenue.source.url.includes(accn));assert.equal(data.annual[0].revenue.source.start,"2025-01-01");
});
test("SEC latest amendment wins without trusting fy on comparative periods",()=>{
 const raw=facts();raw.facts["us-gaap"].Revenues.units.USD.push(fact(110,undefined,undefined,{form:"10-K/A",fy:9999}));
 assert.equal(normalizeSecFacts(raw,"0001045810",retrieved,"2026-10-01").annual[0].revenue.value,110);
});
test("SEC conflicting duplicate same-day facts become UNKNOWN",()=>{
 const raw=facts();raw.facts["us-gaap"].Revenues.units.USD.push(fact(999));
 assert.equal(normalizeSecFacts(raw,"0001045810",retrieved,"2026-10-01").annual[0].revenue.value,null);
});
test("SEC missing fields, foreign units and custom extensions never substitute zero",()=>{
 const raw=facts();delete raw.facts["us-gaap"].NetIncomeLoss;raw.facts["us-gaap"].NetCashProvidedByUsedInOperatingActivities.units={EUR:[fact(30)]};
 raw.facts.extension={Revenues:{units:{USD:[fact(9999)]}}};
 const p=normalizeSecFacts(raw,"0001045810",retrieved,"2026-10-01").annual[0];
 assert.equal(p.netIncome.value,null);assert.equal(p.operatingCF.value,null);assert.equal(p.revenue.value,100);assert.equal(freeCashFlow(p).value,null);
});
test("SEC adapter contracts (TEST DATA): ticker-CIK, declared contact UA, correction-keyed cache and complete FREE report",async()=>{
 const calls=[];let latest=accn;
 const fetcher=async(url,options)=>{
  calls.push({url,ua:options.headers["User-Agent"]});
  if(url.includes("company_tickers"))return response({0:{ticker:"NVDA",cik_str:1045810,title:"NVIDIA [TEST DATA]"}});
  if(url.includes("submissions"))return response({cik:1045810,tickers:["NVDA"],name:"NVIDIA [TEST DATA]",sicDescription:"Semiconductors",filings:{recent:{form:["10-K"],accessionNumber:[latest],filingDate:["2026-02-01"],reportDate:["2025-12-31"]}}});
  return response(facts());
 };
 const provider=new SecProvider(email,fetcher,now,0),candidates=await provider.search("NVDA"),data=await provider.company(candidates[0]),report=buildReport(data);
 assert.equal(report.metadata.mode,"FREE");assert.equal(report.metadata.valuationStatus,"LIMITED");
 assert.equal(report.metadata.provider,"SEC");assert.equal(Object.keys(report.sections).length,12);
 assert.ok(report.sections.valuation[0].value.includes("市場価格ベース指標は未接続"));assert.equal(report.sections.performance[0].kind,"FACT");
 assert.equal(data.description,null);assert.equal(data.quote,null);assert.equal(data.earnings.length,0);
 assert.ok(calls.every(call=>call.ua==="TUTTO Stock Analysis "+email));assert.ok(!JSON.stringify(report).includes(email));
});
test("SEC contact is required and CIK/ticker conflicts fail closed",async()=>{
 assert.throws(()=>new SecProvider(undefined),error=>error.code==="CONFIGURATION_REQUIRED");
 const p=new SecProvider(email,async()=>response({cik:123,tickers:["NVDA"]}),now,0);
 await assert.rejects(p.company({cik:"0001045810",code:"NVDA"}),error=>error.code==="DATA_PROVIDER_ERROR");
});
test("primary HTTP coalesces requests and preserves original retrieval timestamp",async()=>{
 let calls=0,date=now();const http=new PrimaryHttp(async()=>{calls++;return response({ok:true});},0,()=>date);
 const [a,b]=await Promise.all([http.json("https://example.invalid","same",60000),http.json("https://example.invalid","same",60000)]);
 date=new Date("2026-10-01T01:00:00Z");const c=await http.json("https://example.invalid","same",60000);
 assert.equal(calls,1);assert.equal(a.retrievedAt,b.retrievedAt);assert.equal(c.retrievedAt,a.retrievedAt);
});
test("primary HTTP cache invalidation key retrieves changed filing",async()=>{
 let calls=0;const http=new PrimaryHttp(async()=>{calls++;return response({ok:true});},0,now);
 await http.json("https://example.invalid","cik.filing1",60000);await http.json("https://example.invalid","cik.filing2",60000);assert.equal(calls,2);
});
test("primary HTTP serialization throttles request starts",async()=>{
 const times=[];const http=new PrimaryHttp(async()=>{times.push(Date.now());return response({});},25,now);
 await Promise.all(["a","b","c"].map(key=>http.json("https://example.invalid",key,0)));assert.ok(times[1]-times[0]>=20);assert.ok(times[2]-times[1]>=20);
});
for(const status of [401,403,404,429,500])test("primary HTTP "+status+" is safe and does not expose secret URL",async()=>{
 const secret="TEST_KEY_PRIVATE",http=new PrimaryHttp(async()=>new Response(secret,{status}),0,now);
 await assert.rejects(http.get("https://example.invalid?key="+secret,"public",0),error=>!error.message.includes(secret) && error.code===(status===429?"RATE_LIMITED":status===404?"FINANCIALS_UNAVAILABLE":[401,403].includes(status)?"CONFIGURATION_REQUIRED":"DATA_PROVIDER_ERROR"));
});
test("EDINET standard consolidated contexts, branch identifier, units/decimals, signed capex and source trace",()=>{
 const p=normalizeEdinetXbrl(xml(),filing,retrieved)[0];
 assert.equal(p.basis,"annual");assert.equal(p.revenue.value,100000000);assert.equal(p.capex.value,5000000);assert.equal(freeCashFlow(p).value,25000000);
 assert.equal(p.assets.value,80000000);assert.equal(p.debt.value,null);assert.equal(p.revenue.source.classification,"FACT");
 assert.equal(p.revenue.source.contextRef,"annual");assert.ok(p.revenue.source.url.endsWith("?S100TEST"));
});
test("EDINET half-year remains half-year; cumulative nine months is not a single quarter",()=>{
 assert.equal(normalizeEdinetXbrl(xml({start:"2025-04-01",end:"2025-09-30"}),{...filing,docTypeCode:"160",periodStart:"2025-04-01",periodEnd:"2026-03-31"},retrieved)[0].basis,"half-year");
 assert.equal(normalizeEdinetXbrl(xml({start:"2024-04-01",end:"2024-12-31"}),{...filing,docTypeCode:"140",periodStart:"2024-04-01",periodEnd:"2024-12-31"},retrieved).length,0);
 assert.equal(normalizeEdinetXbrl(xml({start:"2024-10-01",end:"2024-12-31"}),{...filing,docTypeCode:"140",periodStart:"2024-04-01",periodEnd:"2024-12-31"},retrieved)[0].basis,"quarterly");
});
test("EDINET rejects issuer mismatch, nonconsolidated dimensions and unsafe entities",()=>{
 assert.throws(()=>normalizeEdinetXbrl(xml({entity:"E00001-000"}),filing,retrieved));
 assert.throws(()=>normalizeEdinetXbrl(xml({dimension:'<xbrli:scenario><xbrldi:explicitMember dimension="x:axis">x:NonConsolidatedMember</xbrldi:explicitMember></xbrli:scenario>'}),filing,retrieved));
 assert.throws(()=>normalizeEdinetXbrl("<!DOCTYPE test>"+xml(),filing,retrieved));
});
test("EDINET custom or segment facts, conflicting values and future periods are never promoted to FACT",()=>{
 assert.equal(normalizeEdinetXbrl(xml({prefix:"custom"}),filing,retrieved).length,0);
 const extra='<jppfs_cor:NetSales contextRef="annual" unitRef="yen">999</jppfs_cor:NetSales>';
 assert.equal(normalizeEdinetXbrl(xml({extra}),filing,retrieved)[0].revenue.value,null);
 assert.throws(()=>normalizeEdinetXbrl(xml({start:"2025-04-01",end:"2026-03-31"}),filing,retrieved));
});
test("EDINET official issuer code list resolves Toyota and alphanumeric Kioxia, without asserting TSE",async()=>{
 const provider=new EdinetProvider(undefined);
 for(const input of ["7203","トヨタ","Toyota","7203.T","7203.TSE","7203.JP"]){const row=await resolveSymbol(input,provider);assert.equal(row.edinetCode,"E02144");assert.equal(row.symbol,"7203.JP");}
 const row=await resolveSymbol("285A",provider);assert.equal(row.edinetCode,"E35948");assert.ok(row.name.includes("キオクシア"));
 await assert.rejects(provider.company(row),error=>error.code==="CONFIGURATION_REQUIRED");
});
test("EDINET updates replace corrections and remove tombstones without reusing old amounts",()=>{
 assert.equal(mergeEdinetRows([filing],[{docID:filing.docID}]).length,0);
 const amended={...filing,docID:"S100NEW1",docTypeCode:"130",parentDocID:filing.docID};
 const rows=mergeEdinetRows([filing],[amended]);assert.equal(rows.length,2);
 assert.equal(mergeEdinetRows(rows,[{...filing,withdrawalStatus:"1"}]).find(row=>row.docID===filing.docID).withdrawalStatus,"1");
});
test("ZIP raw deflate works with Web APIs; CRC, bounds and decompression limits reject corruption",async()=>{
 const data=zipXml(xml()),entries=await readZip(data,name=>name.endsWith(".xbrl"));assert.equal(entries.length,1);assert.ok(new TextDecoder().decode(entries[0].bytes).includes("NetSales"));
 const damaged=Buffer.from(data);damaged[30+Buffer.byteLength("XBRL/PublicDoc/test.xbrl")+5]^=255;await assert.rejects(readZip(damaged,()=>true));
 await assert.rejects(readZip(data,()=>true,10));await assert.rejects(readZip(new Uint8Array(8),()=>true));
});
test("EDINET adapter: indexed official-day revalidation, genuine ZIP parsing and FREE report (TEST DATA only)",async()=>{
 const calls=[],key="TEST_KEY_PRIVATE",index={version:1,coveredThrough:"2026-10-01",retrievedAt:retrieved,filings:[filing]};
 const p=new EdinetProvider(key,index,async url=>{calls.push(url);return url.includes(".json")?response({metadata:{status:"200"},results:[filing]}):new Response(zipXml(xml()));},now,0);
 const candidate=(await p.search("7203"))[0],data=await p.company(candidate),report=buildReport(data);
 assert.equal(data.annual[0].revenue.value,100000000);assert.equal(report.metadata.provider,"EDINET");assert.equal(report.metadata.valuationStatus,"LIMITED");
 assert.ok(!JSON.stringify(report).includes(key));assert.ok(report.sections.notes.some(row=>row.label==="EDINET出典・加工表示"));
});
test("EDINET withdrawal and no-XBRL amendment cannot return pre-correction values",async()=>{
 const amended={...filing,docID:"S100NEW1",parentDocID:filing.docID,docTypeCode:"130",submitDateTime:"2025-07-01 09:00",xbrlFlag:"0"};
 const p=new EdinetProvider("TEST_KEY",{version:1,coveredThrough:"2026-10-01",retrievedAt:retrieved,filings:[filing,amended]},async()=>response({metadata:{status:"200"},results:[filing,amended]}),now,0);
 const data=await p.company((await p.search("7203"))[0]);assert.equal(data.annual.length,0);assert.ok(data.issues.some(issue=>issue.message.includes("訂正前")));
});
test("EDINET stale/missing index is explicit, does not scan hundreds of dates per visitor",async()=>{
 let calls=0;const p=new EdinetProvider("TEST_KEY",{version:1,coveredThrough:null,retrievedAt:null,filings:[]},async()=>{calls++;return response({});},now,0);
 await assert.rejects(p.company((await p.search("7203"))[0]),error=>error.code==="CONFIGURATION_REQUIRED");assert.equal(calls,0);
});
test("FREE API default needs no paid key, missing Japan key is isolated from empty watchlist",async()=>{
 const make=(endpoint,input)=>new Request("https://tutto.test/api/stock-analysis/"+endpoint,input?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({input})}:undefined);
 const env={STOCK_RATE_LIMITER:{limit:async()=>({success:true})}};
 let r=await onRequest({request:make("watchlist"),env});assert.equal(r.status,200);assert.equal((await r.json()).entries.length,0);
 r=await onRequest({request:make("analyze","7203"),env});assert.equal(r.status,503);assert.equal((await r.json()).code,"CONFIGURATION_REQUIRED");
 r=await onRequest({request:make("analyze","NVDA"),env});assert.equal(r.status,503);assert.equal((await r.json()).code,"US_PRIMARY_SOURCE_TEMPORARILY_UNAVAILABLE");
});
test("default FREE mode ignores an unapproved commercial key and never calls EODHD",async()=>{
 const before=global.fetch;global.fetch=async()=>{throw new Error("must not fetch");};
 try{const r=await onRequest({request:new Request("https://tutto.test/api/stock-analysis/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:'{"input":"7203"}'}),env:{EODHD_API_KEY:"TEST_OLD_KEY",STOCK_RATE_LIMITER:{limit:async()=>({success:true})}}});assert.equal(r.status,503);assert.ok(!(await r.text()).includes("TEST_OLD_KEY"));}finally{global.fetch=before;}
});

test("explicit JP codes and Toyota aliases resolve without SEC access; numeric ambiguity remains selectable",async()=>{
 let calls=0;const p=new FreeProvider(email,undefined,undefined,async()=>{calls++;return new Response("blocked",{status:403});},now,0,true);
 for(const input of ["7203.JP","7203.T","Toyota","トヨタ","Kioxia"]){const row=await resolveSymbol(input,p);assert.equal(row.exchange,"JP");}
 assert.equal(calls,0);
 await assert.rejects(resolveSymbol("7203",p),error=>error.code==="AMBIGUOUS_SYMBOL" && error.candidates[0].symbol==="7203.JP");
 assert.equal(calls,1);
 const row=await resolveSymbol("7203.JP",p);await assert.rejects(p.company(row),error=>error.message.includes("EDINET_API_KEY"));
});
test("primary HTTP denial is cooled down rather than retried for every visitor",async()=>{
 let calls=0;const http=new PrimaryHttp(async()=>{calls++;return new Response("",{status:403});},0,now);
 await assert.rejects(http.json("https://example.invalid","a",0));await assert.rejects(http.json("https://example.invalid","b",0));assert.equal(calls,1);
});

test("Toyota reviewed revenue extension is restricted to official issuer namespace; unreviewed extensions remain UNKNOWN",()=>{
 const base=xml({prefix:"custom",extra:'<custom:TotalNetRevenuesIFRS contextRef="annual" unitRef="yen">100000000</custom:TotalNetRevenuesIFRS>'});
 const reviewed=base.replace("https://example.invalid/company","http://disclosure.edinet-fsa.go.jp/jpcrp030000/asr/001/E02144-000/2025-03-31/01/2025-06-18");
 assert.equal(normalizeEdinetXbrl(reviewed,filing,retrieved)[0].revenue.value,100000000);
 assert.equal(normalizeEdinetXbrl(base,filing,retrieved).length,0);
 assert.equal(normalizeEdinetXbrl(reviewed.replaceAll("E02144-000","E35948-000"),{...filing,edinetCode:"E35948"},retrieved).length,0);
 const spoofed=xml().replace("http://disclosure.edinet-fsa.go.jp/taxonomy/jppfs/2025-11-01/jppfs_cor","https://example.invalid/disclosure.edinet-fsa.go.jp/taxonomy/jppfs/fake");
 assert.equal(normalizeEdinetXbrl(spoofed,filing,retrieved).length,0);
});

test("EDINET full-fiscal-year list metadata for half-year does not remove the independently verified annual period",async()=>{
 const annual={...filing,docID:"S100ANN1",periodStart:"2025-04-01",periodEnd:"2026-03-31",submitDateTime:"2026-06-10 09:00"};
 const half={...annual,docID:"S100HALF",docTypeCode:"160",submitDateTime:"2025-11-13 09:00"};
 const p=new EdinetProvider("TEST_KEY",{version:1,coveredThrough:"2026-10-01",retrievedAt:retrieved,filings:[annual,half]},
  async url=>url.includes(".json")?response({metadata:{status:"200"},results:[annual,half]}):new Response(zipXml(xml({start:"2025-04-01",end:url.includes("S100HALF")?"2025-09-30":"2026-03-31"}))),now,0);
 const data=await p.company((await p.search("7203"))[0]);assert.equal(data.annual[0].end,"2026-03-31");assert.equal(data.semiAnnual[0].end,"2025-09-30");
});
