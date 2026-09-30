// Optional REAL-DATA SNAPSHOT validation. Not a live E2E and not loaded by the production handler.
require("./register.cjs");
const fs=require("node:fs"),assert=require("node:assert/strict");
const {normalizeSecFacts}=require("../../server/stock-analysis/sec.ts"),{freeCashFlow}=require("../../server/stock-analysis/calculations.ts");
const filename=process.argv[2];if(!filename){console.error("Pass a locally retrieved official Companyfacts JSON. No network or synthetic fallback.");process.exitCode=1;}else{
 const raw=JSON.parse(fs.readFileSync(filename,"utf8")),cik=String(raw.cik).padStart(10,"0"),now=new Date().toISOString();
 const data=normalizeSecFacts(raw,cik,now,now.slice(0,10)),latest=data.annual[0];assert.ok(latest);
 assert.ok(latest.revenue.value>0);assert.ok(latest.operatingCF.value!==null);assert.ok(latest.capex.value!==null);
 assert.equal(latest.revenue.source.classification,"FACT");assert.equal(freeCashFlow(latest).value,latest.operatingCF.value-latest.capex.value);
 console.log(JSON.stringify({kind:"REAL_DATA_SNAPSHOT_ONLY",cik,entityName:raw.entityName,period:latest.end,annualPeriods:data.annual.length,
  revenue:latest.revenue.value,operatingCF:latest.operatingCF.value,capex:latest.capex.value,fcf:freeCashFlow(latest).value,
  source:latest.revenue.source.url,filingDate:latest.revenue.source.filingDate,status:"PASS"},null,2));
}
