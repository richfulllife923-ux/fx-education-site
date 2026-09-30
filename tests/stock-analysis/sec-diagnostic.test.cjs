// Local-only SEC transport checks. No external SEC calls, browser impersonation or live retry.
require("./register.cjs");
const {test}=require("node:test"),assert=require("node:assert/strict");
const {SecProvider,secRequestHeaders}=require("../../server/stock-analysis/sec.ts");
const contact="configured-contact@example.invalid";
test("SEC declared headers use the configured contact and explicitly exclude implicit br encoding",()=>{
 const headers=secRequestHeaders(contact);assert.equal(headers["User-Agent"],"TUTTO Stock Analysis "+contact);
 assert.equal(headers["Accept-Encoding"],"gzip, deflate");assert.equal(headers.Accept,"application/json");
 for(const invalid of [undefined,"","x@example.invalid\r\nUser-Agent: forged"," x@example.invalid","x@example.invalid "])
  assert.throws(()=>secRequestHeaders(invalid),error=>error.code==="CONFIGURATION_REQUIRED" && (!invalid || !error.message.includes(String(invalid))));
});
test("SEC actual HTTP options stay official, with redirects rejected and headers on both separate endpoints",async()=>{
 const calls=[],provider=new SecProvider(contact,async(url,options)=>{
  calls.push({url,options});
  if(url.includes("/submissions/"))return new Response(JSON.stringify({cik:320193,name:"Apple [TEST DATA]",tickers:["AAPL"],filings:{recent:{}}}));
  return new Response(JSON.stringify({cik:320193,facts:{"us-gaap":{}}}));
 },()=>new Date("2026-10-01T00:00:00Z"),0);
 await provider.company({symbol:"AAPL.US",code:"AAPL",cik:"0000320193",exchange:"US",name:"Apple [TEST DATA]",country:"US",currency:null});
 assert.deepEqual(calls.map(call=>call.url),["https://data.sec.gov/submissions/CIK0000320193.json","https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json"]);
 for(const call of calls){assert.equal(call.options.redirect,"error");assert.deepEqual(call.options.headers,secRequestHeaders(contact));}
});
test("SEC 403 stops the company's remaining calls and cools down a subsequent explicit request",async()=>{
 let calls=0;const provider=new SecProvider(contact,async()=>{calls++;return new Response("blocked",{status:403});},()=>new Date(),0);
 const candidate={symbol:"AAPL.US",code:"AAPL",cik:"0000320193",exchange:"US",name:"Apple [TEST DATA]",country:"US",currency:null};
 await assert.rejects(provider.company(candidate),error=>error.code==="CONFIGURATION_REQUIRED");
 await assert.rejects(provider.company(candidate),error=>error.code==="CONFIGURATION_REQUIRED");assert.equal(calls,1);
});
