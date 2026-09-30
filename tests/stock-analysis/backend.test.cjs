require("./register.cjs");
const {test}=require("node:test"),assert=require("node:assert/strict");
const {numberOrNull,dateOrNull,StockError}=require("../../server/stock-analysis/model.ts");
const {resolveSymbol}=require("../../server/stock-analysis/resolver.ts");
const {freeCashFlow,margin,growth,fcfYield}=require("../../server/stock-analysis/calculations.ts");
const {EodhdProvider}=require("../../server/stock-analysis/eodhd.ts");
const {AnalysisService,failure}=require("../../server/stock-analysis/service.ts");
const {buildReport,comparisonWarnings}=require("../../server/stock-analysis/engine.ts");
const {onRequest}=require("../../functions/api/stock-analysis/[[path]].ts");
const {mockFetch,payload}=require("./fixtures.cjs");
const key="TEST_DATA_PRIVATE_TOKEN",now=()=>new Date("2026-10-01T00:00:00Z");
const candidate={symbol:"NVDA.US",code:"NVDA",name:"NVIDIA [TEST DATA]",exchange:"US",country:"US",currency:"USD"};
const provider=(fetcher=mockFetch(),cache=false)=>new EodhdProvider(key,fetcher,now,cache);
const makeDatum=(value,currency="USD",period="2025-12-31",basis="annual")=>({value,source:{provider:"TEST DATA",url:"https://example.com/test",title:"TEST DATA",retrievedAt:now().toISOString(),
  asOf:"2026-02-01",field:"TEST DATA field",basis,period,currency,unit:"currency"}});
test("strict numeric parsing preserves missing and real zero",()=>{
  for(const value of [null,undefined,""," ","N/A",false,{},Infinity,"1,000","0x10"])assert.equal(numberOrNull(value),null);
  assert.equal(numberOrNull("0"),0);assert.equal(numberOrNull("-1.5e2"),-150);
});
test("calendar dates reject rollover and unknown dates",()=>{
  assert.equal(dateOrNull("2026-02-30"),null);assert.equal(dateOrNull("2024-02-29"),"2024-02-29");
});
test("FCF formula, input trace and missing capex",()=>{
  const period={operatingCF:makeDatum(100),capex:makeDatum(30)};
  const calc=freeCashFlow(period);assert.equal(calc.value,70);assert.equal(calc.inputs.length,2);
  assert.equal(freeCashFlow({...period,capex:makeDatum(null)}).value,null);
});
test("calculations refuse mixed currencies, dates, annual/quarterly and unknown currency",()=>{
  for(const datum of [makeDatum(30,"JPY"),makeDatum(30,"USD","2024-12-31"),makeDatum(30,"USD","2025-12-31","quarterly"),makeDatum(30,null)])
    assert.equal(freeCashFlow({operatingCF:makeDatum(100),capex:datum}).value,null);
});
test("margin and FCF yield have positive denominator guards",()=>{
  assert.equal(margin(makeDatum(10),makeDatum(100)).value,10);
  assert.equal(margin(makeDatum(10),makeDatum(0)).value,null);
  assert.equal(fcfYield(makeDatum(10),makeDatum(200)).value,5);
  assert.equal(fcfYield(makeDatum(10),makeDatum(200,"JPY")).value,null);
});
test("growth only compares successive annual periods, does not invent loss growth",()=>{
  assert.equal(growth(makeDatum(120),makeDatum(100,"USD","2024-12-31")).value,19.999999999999996);
  assert.equal(growth(makeDatum(120),makeDatum(-100,"USD","2024-12-31")).value,null);
  assert.equal(growth(makeDatum(120),makeDatum(100,"USD","2022-12-31")).value,null);
});
for(const [input,symbol] of Object.entries({"トヨタ":"7203.TSE","7203":"7203.TSE","Toyota":"7203.TSE","Toyota Motor":"7203.TSE","7203.T":"7203.TSE",
  "NVDA":"NVDA.US","ｎｖｄａ":"NVDA.US"," NVIDIA ":"NVDA.US","キオクシア":"285A.TSE","285A":"285A.TSE","Kioxia":"285A.TSE",
  "AAPL":"AAPL.US","Apple":"AAPL.US","MSFT":"MSFT.US","GOOGL":"GOOGL.US"}))
  test("TEST DATA resolver: "+input,async()=>assert.equal((await resolveSymbol(input,provider())).symbol,symbol));
test("four-digit number is verified across markets and ambiguity is preserved",async()=>{
  const rows=[{Code:"7203",Exchange:"US",Name:"US TEST DATA",Country:"USA",Currency:"USD",Type:"Common Stock"},
    {Code:"7203",Exchange:"TSE",Name:"Japan TEST DATA",Country:"Japan",Currency:"JPY",Type:"Common Stock"}];
  await assert.rejects(resolveSymbol("7203",provider(mockFetch({searchRows:rows}))),error=>error.code==="AMBIGUOUS_SYMBOL" && error.candidates.length===2);
  assert.equal((await resolveSymbol("7203.T",provider(mockFetch({searchRows:rows})))).symbol,"7203.TSE");
});
test("invalid/nonexistent input, no arbitrary provider first-result choice",async()=>{
  await assert.rejects(resolveSymbol("",provider()),error=>error.code==="INVALID_INPUT");
  await assert.rejects(resolveSymbol("DOES_NOT_EXIST",provider()),error=>error.code==="SYMBOL_NOT_FOUND");
  const fake={search:async()=>[{...candidate,symbol:"A.US",code:"A"},{...candidate,symbol:"B.US",code:"B"}]};
  await assert.rejects(resolveSymbol("Company",fake),error=>error.code==="AMBIGUOUS_SYMBOL");
});
test("real adapter normalizes 5 annual and separate quarterly TEST DATA periods",async()=>{
  const data=await provider().company(candidate);
  assert.equal(data.annual.length,5);assert.equal(data.quarterly[0].basis,"quarterly");
  assert.equal(data.annual[0].capex.value,50);assert.equal(freeCashFlow(data.annual[0]).value,100);
  assert.equal(data.annual[0].revenue.source.period,"2025-12-31");
  assert.equal(data.quote.price.source.asOf,"2026-09-30T18:00:00.000Z");
  assert.equal(data.earnings[0].date,"2026-11-05");
});
test("wrong company/country is stopped",async()=>{
  await assert.rejects(provider(mockFetch({transform:value=>({...value,General:{...value.General,Code:"WRONG"}})})).company(candidate),error=>error.code==="DATA_PROVIDER_ERROR");
});
test("missing cash flow and red EPS remain unknown, not zero or low P/E",async()=>{
  const data=await provider(mockFetch({transform:value=>{
    value.Financials.Cash_Flow={};value.Highlights.EarningsShare=-1;return value;
  }})).company(candidate);
  assert.equal(data.annual[0].operatingCF.value,null);assert.equal(freeCashFlow(data.annual[0]).value,null);
  assert.equal(data.valuation.pe.value,null);assert.ok(data.issues.some(issue=>issue.code==="FINANCIALS_UNAVAILABLE"));
});
test("quote and earnings failures allow partial financial report",async()=>{
  const data=await provider(mockFetch({fail:["real-time","calendar/earnings"]})).company(candidate);
  assert.equal(data.quote,null);assert.equal(data.earnings.length,0);assert.equal(data.annual.length,5);
  const report=buildReport(data);assert.equal(report.metadata.issues[0].code,"PARTIAL_DATA");
});
test("provider error, timeout/exception and secret redaction",async()=>{
  await assert.rejects(provider(mockFetch({fail:["search"]})).search("NVDA"),error=>error.code==="RATE_LIMITED");
  const unsafe=provider(async()=>{throw new Error("https://example.com/?api_token="+key);});
  const result=await new AnalysisService(unsafe).analyze("NVDA");
  assert.equal(result.status,"error");assert.ok(!JSON.stringify(result).includes(key));
  assert.ok(!JSON.stringify(failure(new Error(key))).includes(key));
});
test("production demo keys are rejected",()=>assert.throws(()=>new EodhdProvider("demo"),error=>error.code==="CONFIGURATION_REQUIRED"));
test("cache disabled by default; licensed cache coalesces and keeps original retrieval time",async()=>{
  const calls=mockFetch();const p=provider(calls,true);
  await Promise.all([p.company(candidate),p.company(candidate)]);
  assert.equal(calls.calls.length,3);
  const first=await p.company(candidate);assert.equal(calls.calls.length,3);
  assert.equal(first.retrievedAt,now().toISOString());
  const uncached=mockFetch();const p2=provider(uncached);
  await p2.company(candidate);await p2.company(candidate);assert.equal(uncached.calls.length,6);
});
test("all 12 sections, source claims, mandatory counter-thesis, conditional scenarios and 8 semiconductor monitors",async()=>{
  const report=buildReport(await provider().company(candidate));
  assert.equal(Object.keys(report.sections).length,12);
  assert.ok(report.sections.risk.some(item=>item.label.startsWith("Counter-Thesis")));
  assert.equal(report.sections.scenarios.length,3);
  assert.equal(report.sections.earnings.filter(item=>item.label.startsWith("確認項目")).length,8);
  assert.ok(report.sections["cash-flow"].find(item=>item.kind==="CALCULATION").inputs.length);
  assert.equal(report.emerging.classification,"UNVERIFIED");assert.ok(report.emerging.missing.length);
  assert.ok(!JSON.stringify(report).includes(key));
  assert.ok(!Object.values(report.sections).flat().some(item=>item.kind==="FACT"));
});
test("comparison uses the same canonical reports and warns period/currency differences",async()=>{
  const service=new AnalysisService(provider());
  const result=await service.compare("7203","NVDA");assert.equal(result.status,"ready");
  assert.ok(result.warnings.some(warning=>warning.includes("財務通貨")));
  const a=result.a.report,b=result.b.report;b.metadata.fiscalDate="2025-03-31";
  assert.ok(comparisonWarnings(a,b).some(warning=>warning.includes("決算期")));
  const same=await service.compare("NVDA","NVIDIA");
  assert.ok(same.warnings.some(warning=>warning.includes("同一企業")));
});
test("watchlist empty by default; owner-selected entries include evidence, risks and next event",async()=>{
  const service=new AnalysisService(provider());assert.equal((await service.watchlist([])).entries.length,0);
  const result=await service.watchlist(["7203","NVDA"]);assert.equal(result.entries.length,2);
  assert.ok(result.entries.every(entry=>entry.risk && entry.nextConfirmation && entry.evidence.length));
});
test("API blocks missing configuration, cross-origin, unsupported method and endpoint",async()=>{
  const post=(path="/analyze",headers={})=>new Request("https://tutto.test/api/stock-analysis"+path,{method:"POST",headers:{"Content-Type":"application/json",...headers},body:'{"input":"7203"}'});
  let response=await onRequest({request:post(),env:{STOCK_DATA_MODE:"EODHD"}});
  assert.equal(response.status,503);assert.equal((await response.json()).code,"CONFIGURATION_REQUIRED");
  response=await onRequest({request:post("/analyze",{Origin:"https://other.test"}),env:{STOCK_DATA_MODE:"EODHD"}});assert.equal(response.status,403);
  response=await onRequest({request:new Request("https://tutto.test/api/stock-analysis/analyze"),env:{STOCK_DATA_MODE:"EODHD"}});assert.equal(response.status,405);
  response=await onRequest({request:post("/nope"),env:{STOCK_DATA_MODE:"EODHD"}});assert.equal(response.status,404);
});
test("public display requires approval even with a key; request errors never echo it",async()=>{
  const response=await onRequest({request:new Request("https://tutto.test/api/stock-analysis/analyze",{method:"POST",body:'{"input":"NVDA"}'}),env:{STOCK_DATA_MODE:"EODHD",EODHD_API_KEY:key}});
  assert.equal(response.status,503);assert.ok(!(await response.text()).includes(key));
});
test("API rejects malformed and oversized input, enforces rate limit binding",async()=>{
  const env={STOCK_DATA_MODE:"EODHD",SEC_LIVE_ENABLED:"true",SEC_PUBLIC_RELEASE_APPROVED:"true",EODHD_API_KEY:key,EODHD_PUBLIC_DISPLAY_APPROVED:"true"};
  let response=await onRequest({request:new Request("https://tutto.test/api/stock-analysis/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:"["}),env});
  assert.equal(response.status,400);
  response=await onRequest({request:new Request("https://tutto.test/api/stock-analysis/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:" ".repeat(1100)}),env});
  assert.equal(response.status,400);
  response=await onRequest({request:new Request("https://tutto.test/api/stock-analysis/analyze",{method:"POST"}),env:{...env,STOCK_RATE_LIMITER:{limit:async()=>({success:false})}}});
  assert.equal(response.status,429);
});

test("company-name aliases reject a reused code with a different company name",async()=>{
  const rows=[{Code:"7203",Exchange:"TSE",Name:"Other issuer [TEST DATA]",Country:"Japan",Currency:"JPY",Type:"Common Stock"}];
  await assert.rejects(resolveSymbol("Toyota",provider(mockFetch({searchRows:rows}))),error=>error.code==="SYMBOL_NOT_FOUND");
});
test("loss and negative FCF generate supported risk conditions without buy/sell verdicts",async()=>{
  const data=await provider(mockFetch({transform:value=>{
    value.Financials.Income_Statement.yearly["2025-12-31"].netIncome="-50";
    value.Financials.Cash_Flow.yearly["2025-12-31"].totalCashFromOperatingActivities="-10";
    return value;
  }})).company(candidate);
  const report=buildReport(data);
  assert.ok(report.sections.risk.some(item=>item.label==="赤字の継続リスク"));
  assert.ok(report.sections.risk.some(item=>item.label==="投資・資金需要"));
});
test("cross-statement currencies are not mixed; same-currency cash flow remains usable",async()=>{
  const data=await provider(mockFetch({transform:value=>{
    value.Financials.Cash_Flow.yearly["2025-12-31"].currency_symbol="JPY";
    return value;
  }})).company(candidate);
  assert.equal(freeCashFlow(data.annual[0]).value,100);
  assert.equal(freeCashFlow(data.annual[0]).source.currency,"JPY");
  const report=buildReport(data);
  assert.equal(report.sections["cash-flow"].find(item=>item.label==="営業CF / 純利益").kind,"UNKNOWN");
});
test("unknown market cap currency and missing FCF yield are explicitly preserved",async()=>{
  const data=await provider().company(candidate),report=buildReport(data);
  assert.equal(data.valuation.marketCap.source.currency,null);
  assert.equal(report.sections.valuation.find(item=>item.label==="FCF Yield").kind,"UNKNOWN");
});
test("transient cache preserves first network retrieval timestamp across repeated reads",async()=>{
  let clock=new Date("2026-10-01T00:00:00Z");
  const calls=mockFetch(),p=new EodhdProvider(key,calls,()=>clock,true);
  const first=await p.company(candidate);clock=new Date("2026-10-01T00:00:01Z");
  const second=await p.company(candidate);
  assert.equal(second.retrievedAt,first.retrievedAt);assert.equal(calls.calls.length,3);
});
test("financial sector warns that ordinary FCF is not distributable financial earnings",async()=>{
  const data=await provider(mockFetch({transform:value=>{value.General.Sector="Financial Services";value.General.Industry="Banks";return value;}})).company(candidate);
  const report=buildReport(data);
  assert.ok(report.sections["cash-flow"].some(item=>item.label==="金融業での適用制限"));
});
test("full financial absence keeps company identity and twelve sections with unavailable issues",async()=>{
  const data=await provider(mockFetch({transform:value=>{value.Financials={};return value;}})).company(candidate);
  const report=buildReport(data);
  assert.equal(Object.keys(report.sections).length,12);
  assert.equal(report.metadata.fiscalDate,null);
  assert.ok(report.metadata.issues.some(issue=>issue.code==="FINANCIALS_UNAVAILABLE"));
});
