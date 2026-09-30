// Read-only official AAPL demo check. Never used by the production application.
require("./register.cjs");
const assert=require("node:assert/strict");
const {EodhdProvider}=require("../../server/stock-analysis/eodhd.ts");
const {buildReport}=require("../../server/stock-analysis/engine.ts");
(async()=>{
  if(process.env.STOCK_LIVE_DEMO_TEST!=="1"){console.log("SKIPPED: set STOCK_LIVE_DEMO_TEST=1 to explicitly run official AAPL demo only.");return;}
  const realFetch=global.fetch;
  const testFetch=(url,options)=>{const parsed=new URL(url);parsed.searchParams.set("api_token","demo");return realFetch(parsed,options);};
  const provider=new EodhdProvider("TEST_ONLY_NOT_A_PRIVATE_KEY",testFetch);
  const data=await provider.company({symbol:"AAPL.US",code:"AAPL",name:"Apple",exchange:"US",country:"US",currency:"USD"});
  const report=buildReport(data);
  assert.equal(report.symbol,"AAPL.US");assert.ok(data.annual.length>=3);
  assert.ok(data.annual[0].revenue.value>0);
  assert.ok(report.sections["cash-flow"].some(item=>item.kind==="CALCULATION"));
  console.log(JSON.stringify({test:"Official AAPL demo / read-only / no production fallback",result:"PASS",
    company:data.identity.name,annualPeriods:data.annual.map(period=>period.end),
    currency:data.annual[0].currency,providerUpdatedAt:data.updatedAt,retrievedAt:data.retrievedAt,
    quoteAvailable:!!data.quote,earningsAvailable:!!data.earnings.length,
    issues:data.issues,requiredLiveE2E:{"7203":"BLOCKED (owner key/licensing unavailable)","NVDA":"BLOCKED (owner key/licensing unavailable)"}},null,2));
})().catch(error=>{console.error({result:"FAIL",code:error.code??"TEST_ERROR",message:error.message});process.exitCode=1;});
