// TEST DATA only. Every fetch is trapped or synthetic; never contacts SEC or EDINET.
require("./register.cjs");
const {test}=require("node:test"),assert=require("node:assert/strict");
const {FreeProvider}=require("../../server/stock-analysis/free.ts");
const {resolveSymbol}=require("../../server/stock-analysis/resolver.ts");
const {onRequest}=require("../../functions/api/stock-analysis/[[path]].ts");
const code="US_PRIMARY_SOURCE_TEMPORARILY_UNAVAILABLE";
const env={STOCK_DATA_MODE:"FREE",SEC_CONTACT_EMAIL:"test-owner@example.invalid",EDINET_API_KEY:"TEST_DATA_JP_KEY",STOCK_RATE_LIMITER:{limit:async()=>({success:true})}};
const request=(endpoint,body)=>new Request("https://tutto.test/api/stock-analysis/"+endpoint,body===undefined?undefined:{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
test("Japan-only default resolves all supported aliases and unknown JP without any SEC lookup",async()=>{
 let calls=0;const p=new FreeProvider(env.SEC_CONTACT_EMAIL,undefined,undefined,async()=>{calls++;throw new Error("Unexpected outbound");},()=>new Date("2026-10-01"),0);
 for(const [input,expected]of [["7203","7203.JP"],["7203.JP","7203.JP"],["トヨタ","7203.JP"],["Toyota","7203.JP"],["285A","285A.JP"],["285A.JP","285A.JP"],["キオクシア","285A.JP"],["Kioxia","285A.JP"]])assert.equal((await resolveSymbol(input,p)).symbol,expected);
 await assert.rejects(resolveSymbol("9999.JP",p),error=>error.code==="SYMBOL_NOT_FOUND");
 await assert.rejects(resolveSymbol("9999",p),error=>error.code==="SYMBOL_NOT_FOUND");
 assert.equal(calls,0);
});
test("US symbols, aliases, explicit US and unknown US-like inputs return maintenance, not false not-found",async()=>{
 let calls=0;const p=new FreeProvider(undefined,undefined,undefined,async()=>{calls++;throw new Error("Unexpected outbound");},()=>new Date(),0);
 for(const input of ["NVDA","NVIDIA","AAPL","Apple","MSFT","GOOGL","NVDA.US","UNKNOWNZZZ"])
 await assert.rejects(resolveSymbol(input,p),error=>error.code===code && !error.message.includes("403"));
 await assert.rejects(async()=>p.company({exchange:"US",symbol:"NVDA.US",code:"NVDA"}),error=>error.code===code);
 assert.equal(calls,0);
});
test("API analyze/emerging US are 503 unavailable and non-retryable with no outbound requests",async()=>{
 const before=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw new Error("Unexpected outbound");};
 try{
  for(const endpoint of ["analyze","emerging"])for(const input of ["NVDA","AAPL","UNKNOWNZZZ"]){
   const response=await onRequest({request:request(endpoint,{input}),env});assert.equal(response.status,503);
   const result=await response.json();assert.equal(result.status,"unavailable");assert.equal(result.code,code);assert.equal(result.retryable,false);assert.ok(!result.report);
  }
  assert.equal(calls,0);
 }finally{global.fetch=before;}
});
test("US-only comparison and watchlist preserve per-symbol maintenance without fabricated evidence",async()=>{
 const before=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw new Error("Unexpected outbound");};
 try{
  let response=await onRequest({request:request("compare",{a:"NVDA",b:"AAPL"}),env}),result=await response.json();
  assert.equal(response.status,200);assert.equal(result.status,"ready");assert.equal(result.a.code,code);assert.equal(result.b.code,code);
  assert.ok(result.warnings[0].includes("比較を保留"));
  response=await onRequest({request:request("watchlist"),env:{...env,TUTTO_WATCHLIST_SYMBOLS:"NVDA.US,AAPL.US"}});
  result=await response.json();assert.deepEqual(result.entries,[]);assert.deepEqual(result.issues.map(issue=>issue.symbol),["NVDA.US","AAPL.US"]);
  assert.ok(result.issues.every(issue=>issue.code===code));assert.equal(calls,0);
 }finally{global.fetch=before;}
});
test("one SEC enable flag cannot enable public release, and disabling after explicit approval changes the cached routing",async()=>{
 const before=global.fetch;let calls=0;global.fetch=async url=>{calls++;assert.ok(new URL(url).hostname.endsWith("sec.gov"));return new Response("TEST DATA denied",{status:403});};
 try{
  let response=await onRequest({request:request("analyze",{input:"NVDA"}),env:{...env,SEC_LIVE_ENABLED:"true"}});
  assert.equal((await response.json()).code,code);assert.equal(calls,0);
  response=await onRequest({request:request("analyze",{input:"NVDA"}),env:{...env,SEC_LIVE_ENABLED:"true",SEC_PUBLIC_RELEASE_APPROVED:"true"}});
  assert.equal((await response.json()).code,"CONFIGURATION_REQUIRED");assert.equal(calls,1);
  response=await onRequest({request:request("analyze",{input:"NVDA"}),env:{...env,SEC_LIVE_ENABLED:"false",SEC_PUBLIC_RELEASE_APPROVED:"true"}});
  assert.equal((await response.json()).code,code);assert.equal(calls,1);
 }finally{global.fetch=before;}
});

test("an explicitly configured legacy commercial key cannot bypass the closed US publication gate",async()=>{
 const before=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw new Error("Unexpected outbound");};
 try{const response=await onRequest({request:request("analyze",{input:"NVDA"}),env:{...env,STOCK_DATA_MODE:"EODHD",EODHD_API_KEY:"TEST_DATA_COMMERCIAL",EODHD_PUBLIC_DISPLAY_APPROVED:"true"}});
 assert.equal(response.status,503);assert.equal((await response.json()).code,"CONFIGURATION_REQUIRED");assert.equal(calls,0);
 }finally{global.fetch=before;}
});

test("Pages API calls native fetch with a valid global receiver (TEST DATA only)",async()=>{
 const before=global.fetch;let calls=0,invalidReceiver=false;
 global.fetch=async function(url){"use strict";calls++;if(this!==undefined && this!==globalThis){invalidReceiver=true;throw new TypeError("Illegal invocation");}assert.equal(new URL(url).hostname,"api.edinet-fsa.go.jp");return new Response("TEST DATA denied",{status:403});};
 try{const response=await onRequest({request:request("analyze",{input:"7203.JP"}),env:{...env,EDINET_API_KEY:"TEST_DATA_NATIVE_RECEIVER"}});
 const result=await response.json();assert.equal(invalidReceiver,false,"Native fetch must not receive a provider instance as this");assert.equal(result.code,"CONFIGURATION_REQUIRED");assert.equal(response.status,503);assert.equal(calls,1);
 }finally{global.fetch=before;}
});

test("Pages API rejects official-source redirects with Workers-compatible manual mode",async()=>{
 const before=global.fetch;let calls=0;
 global.fetch=async(url,options)=>{calls++;assert.equal(new URL(url).hostname,"api.edinet-fsa.go.jp");assert.equal(options.redirect,"manual");return new Response("TEST DATA redirect",{status:302,headers:{Location:"https://unofficial.invalid/do-not-follow"}});};
 try{const response=await onRequest({request:request("analyze",{input:"7203.JP"}),env:{...env,EDINET_API_KEY:"TEST_DATA_WORKERS_REDIRECT"}});
 const result=await response.json();assert.equal(response.status,502);assert.equal(result.code,"DATA_PROVIDER_ERROR");assert.ok(!result.report);assert.equal(calls,1);assert.ok(!JSON.stringify(result).includes("unofficial.invalid"));
 }finally{global.fetch=before;}
});