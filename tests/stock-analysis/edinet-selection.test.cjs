// TEST DATA ONLY: selection and failure injection, no external requests.
require("./register.cjs");
const {test}=require("node:test"),assert=require("node:assert/strict"),zlib=require("node:zlib");
const {EdinetProvider}=require("../../server/stock-analysis/edinet.ts");
const {buildReport}=require("../../server/stock-analysis/engine.ts");
const now=()=>new Date("2026-10-01T00:00:00Z");
const current={docID:"S100NEW1",edinetCode:"E02144",secCode:"72030",filerName:"Toyota [TEST DATA]",docTypeCode:"120",periodStart:"2025-04-01",periodEnd:"2026-03-31",submitDateTime:"2026-06-10 15:33",parentDocID:null,xbrlFlag:"1",withdrawalStatus:"0",disclosureStatus:"0"};
const old={...current,docID:"S100OLD1",periodStart:"2024-04-01",periodEnd:"2025-03-31",submitDateTime:"2025-06-18 15:30"};
function xbrl(row){
 const half=["160","170"].includes(row.docTypeCode),end=half?"2025-09-30":row.periodEnd;
 return '<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance" xmlns:jppfs_cor="http://disclosure.edinet-fsa.go.jp/taxonomy/jppfs/2025-11-01/jppfs_cor">'+
 '<xbrli:context id="period"><xbrli:entity><xbrli:identifier>'+row.edinetCode+'-000</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:startDate>'+row.periodStart+'</xbrli:startDate><xbrli:endDate>'+end+'</xbrli:endDate></xbrli:period></xbrli:context>'+
 '<xbrli:unit id="yen"><xbrli:measure>iso4217:JPY</xbrli:measure></xbrli:unit>'+
 '<jppfs_cor:NetSales contextRef="period" unitRef="yen">100</jppfs_cor:NetSales></xbrli:xbrl>';
}
function zip(text){
 const bytes=Buffer.from(text),compressed=zlib.deflateRawSync(bytes),name=Buffer.from("XBRL/PublicDoc/test.xbrl"),local=Buffer.alloc(30),central=Buffer.alloc(46),end=Buffer.alloc(22);
 let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}crc=(crc^0xffffffff)>>>0;
 local.writeUInt32LE(0x04034b50);local.writeUInt16LE(8,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(name.length,26);
 central.writeUInt32LE(0x02014b50);central.writeUInt16LE(8,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(bytes.length,24);central.writeUInt16LE(name.length,28);
 end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(central.length+name.length,12);end.writeUInt32LE(local.length+name.length+compressed.length,16);
 return Buffer.concat([local,name,compressed,central,name,end]);
}
function provider(rows,override=()=>undefined){
 const calls=[],p=new EdinetProvider("TEST_KEY",{version:1,coveredThrough:"2026-10-01",retrievedAt:now().toISOString(),filings:rows},
 async url=>{
  const path=new URL(url).pathname;calls.push(path);
  if(path.endsWith(".json"))return new Response(JSON.stringify({metadata:{status:"200"},results:rows}));
  const row=rows.find(row=>path.endsWith(row.docID));assert.ok(row);
  return override(row)??new Response(zip(xbrl(row)));
 },now,0);
 return {p,calls};
}
async function company(p){return p.company((await p.search("7203"))[0]);}
test("latest annual fiscal end wins over a later-submitted old-year amendment; half-year metadata does not become annual",async()=>{
 const amendedOld={...old,docID:"S100AMD1",docTypeCode:"130",parentDocID:old.docID,submitDateTime:"2026-08-01 10:00"};
 const half={...current,docID:"S100HALF",docTypeCode:"160",submitDateTime:"2025-11-13 15:30"};
 for(const rows of [[amendedOld,half,current,old],[current,old,half,amendedOld]]){
  const {p}=provider(rows),data=await company(p);
  assert.equal(buildReport(data).metadata.fiscalDate,"2026-03-31");
  assert.equal(data.annual[0].revenue.source.accession,current.docID);
  assert.equal(data.annual[1].revenue.source.accession,amendedOld.docID);
  assert.equal(data.semiAnnual[0].basis,"half-year");assert.equal(data.semiAnnual[0].end,"2025-09-30");
 }
});
test("latest annual HTTP failure cannot promote FY2025; a later explicit request can recover FY2026",async()=>{
 let fail=true;const {p,calls}=provider([old,current],row=>row.docID===current.docID && fail?new Response("TEST transient failure",{status:500}):undefined);
 await assert.rejects(company(p),error=>error.code==="DATA_PROVIDER_ERROR" && error.message.includes("2026-03-31") && error.message.includes(current.docID));
 assert.equal(calls.filter(path=>path.endsWith(current.docID)).length,1,"No automatic retry");
 fail=false;const data=await company(p);assert.equal(buildReport(data).metadata.fiscalDate,"2026-03-31");
 assert.equal(calls.filter(path=>path.endsWith(current.docID)).length,2,"Only the explicit second request retries");
});
test("latest annual ZIP or missing current-year XBRL context cannot promote an older annual period",async()=>{
 for(const response of [()=>new Response("TEST invalid ZIP"),()=>new Response(zip(xbrl(old)))]){
  const {p}=provider([current,old],row=>row.docID===current.docID?response():undefined);
  await assert.rejects(company(p),error=>error.code==="DATA_PROVIDER_ERROR" && error.message.includes(current.docID));
 }
});
test("same-period annual amendment wins; a no-XBRL amendment cannot fall back to the original or older fiscal year",async()=>{
 const amended={...current,docID:"S100AMD2",docTypeCode:"130",parentDocID:current.docID,submitDateTime:"2026-08-01 10:00"};
 let {p}=provider([old,current,amended]);let data=await company(p);
 assert.equal(data.annual[0].revenue.source.accession,amended.docID);assert.equal(data.annual[0].end,"2026-03-31");
 ({p}=provider([old,current,{...amended,xbrlFlag:"0"}]));
 await assert.rejects(company(p),error=>error.code==="DATA_PROVIDER_ERROR" && error.message.includes(amended.docID));
});
test("missing individual fields remain UNKNOWN in the current-year report, without requiring a complete statement",async()=>{
 const {p}=provider([old,current]),data=await company(p),report=buildReport(data);
 assert.equal(report.metadata.fiscalDate,"2026-03-31");assert.equal(data.annual[0].netIncome.value,null);
 assert.ok(report.sections.performance.some(row=>row.label==="Net Income" && row.kind==="UNKNOWN"));
});
