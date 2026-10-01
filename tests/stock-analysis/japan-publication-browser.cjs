// Live EDINET + browser publication audit. Never contacts SEC; no snapshot/fixture fallback.
require("./register.cjs");
const fs=require("node:fs"),path=require("node:path"),http=require("node:http"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||"playwright");
const {onRequest}=require("../../functions/api/stock-analysis/[[path]].ts");
const root=path.resolve(__dirname,"../.."),output=path.join(root,".stock-test-output");fs.mkdirSync(output,{recursive:true});
const env={STOCK_DATA_MODE:"FREE",SEC_LIVE_ENABLED:"false",SEC_PUBLIC_RELEASE_APPROVED:"false",TUTTO_WATCHLIST_SYMBOLS:"7203.JP,NVDA.US",STOCK_RATE_LIMITER:{limit:async()=>({success:true})}};
for(const line of fs.readFileSync(path.join(root,".dev.vars"),"utf8").split(/\r?\n/)){const match=/^(SEC_CONTACT_EMAIL|EDINET_API_KEY)=(.*)$/.exec(line);if(match)env[match[1]]=match[2].trim().replace(/^(['"])(.*)\1$/,"$2");}
assert.ok(env.EDINET_API_KEY);
const originalFetch=global.fetch,requests=[],errors=[],results=[],reports=new Map();let secCalls=0;
global.fetch=async(url,options)=>{
 const target=new URL(url);
 if(target.hostname==="data.sec.gov" || target.hostname==="www.sec.gov"){secCalls++;throw new Error("SEC live request prohibited");}
 assert.equal(target.hostname,"api.edinet-fsa.go.jp","Unofficial provider forbidden");
 const response=await originalFetch(url,options);requests.push({path:target.pathname,date:target.searchParams.get("date"),status:response.status});return response;
};
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".json":"application/json"};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,"http://127.0.0.1:"+server.address().port);
  if(url.pathname.startsWith("/api/stock-analysis/")){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);const headers=new Headers();
   for(const [key,value]of Object.entries(req.headers))if(typeof value==="string")headers.set(key,value);
   const body=Buffer.concat(chunks),request=new Request(url,{method:req.method,headers,body:req.method==="GET"?undefined:body});
   const response=await onRequest({request,env}),bytes=Buffer.from(await response.arrayBuffer()),json=JSON.parse(bytes);
   if(url.pathname.endsWith("/analyze"))reports.set(JSON.parse(body).input,{httpStatus:response.status,...json});
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(bytes);return;
  }
  const out=path.join(root,"out");let file=path.resolve(out,"."+decodeURIComponent(url.pathname));
  if(file!==out && !file.startsWith(out+path.sep)){res.writeHead(403).end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,"index.html");
  if(!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader("Content-Type",mime[path.extname(file)]||"application/octet-stream");res.end(fs.readFileSync(file));
 }catch{res.writeHead(500).end("Local audit server failure");}
});
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));const base="http://127.0.0.1:"+server.address().port;
  browser=await chromium.launch({headless:true,channel:"chrome"});const page=await browser.newPage({viewport:{width:375,height:900}});
  page.on("pageerror",error=>errors.push(error.message));await page.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  for(const input of ["7203","7203.JP","トヨタ","Toyota","285A","285A.JP","キオクシア","Kioxia"]){
   await page.goto(base+"/stock-analysis/analyze/?"+new URLSearchParams({symbol:input}),{waitUntil:"networkidle"});
   await page.waitForFunction(()=>!document.querySelector('[role="status"]')?.textContent.includes("取得・照合しています"),{timeout:65000});
   const result=reports.get(input);assert.equal(result?.status,"ready","Japan live analysis must be ready");
   const report=result.report;assert.equal(report.metadata.provider,"EDINET");assert.equal(report.metadata.fiscalDate,"2026-03-31");assert.equal(report.metadata.valuationStatus,"LIMITED");
   const debt=report.sections.finance.find(row=>row.label==="Debt");
   const toyota=report.symbol==="7203.JP",expectedDebt=toyota?43205469000000:1253189000000;
   assert.equal(Number(debt.value.replace(/ JPY$/,"").replace(/,/g,"")),expectedDebt);
   assert.equal(debt.debt.sourceType,toyota?"SOURCE_DECLARED_TOTAL":"CALCULATED_FROM_COMPONENTS");
   assert.equal(debt.kind,toyota?"FACT":"CALCULATION");assert.equal(debt.debt.scope,"CONSOLIDATED");
   assert.equal(debt.debt.doubleCount,"NO");assert.ok(debt.debt.checks.every(c=>c.passed));
   assert.equal(debt.debt.fiscalDate,"2026-03-31");assert.equal(report.researchStatus.dataCompleteness.debt,"AVAILABLE");
   assert.equal(report.researchStatus.status,"STAY");assert.ok(report.researchStatus.pendingReasons.some(s=>s.includes("重大リスク")));
   assert.ok(debt.debt.components.every(c=>c.fiscalDate==="2026-03-31"&&c.currency==="JPY"));
   if(toyota){assert.equal(debt.debt.validationValue,expectedDebt);assert.equal(debt.debt.supplemental.length,2);}
   else{assert.equal(debt.inputs.length,4);assert.notEqual(expectedDebt,1075906000000);assert.ok(debt.debt.checks.some(c=>c.id==="D2/lease-exclusion-confirmation"));}
   assert.equal(Object.keys(report.sections).length,12);assert.equal(await page.locator("main h2").count(),13);
   assert.ok(report.sections.performance.find(row=>row.label==="Revenue").sourceUrl.includes(report.symbol==="7203.JP"?"S100Y8NY":"S100YJ18"));
      const expectedStatus=report.sections.finance.find(row=>row.label==="Debt")?.kind==="UNKNOWN"?"GRAY":"STAY";
   assert.equal(report.researchStatus.status,expectedStatus);
   if(expectedStatus==="GRAY")assert.ok(report.researchStatus.nextChecks[0].includes("有利子負債"));
   await page.locator('[data-research-status="'+expectedStatus+'"]').waitFor();
   assert.equal(await page.locator('[data-key-numbers] dt').count(),5);
   const closed=await page.locator("main").innerText();
   for(const raw of ["FACT","CALCULATION","CONFIRMED","UNKNOWN","S100YJ18","S100Y8NY","retrievedAt","SOURCE_DECLARED_TOTAL","CALCULATED_FROM_COMPONENTS","FINANCIAL_BUSINESS"])
    assert.ok(!closed.includes(raw),"Raw metadata exposed by default: "+raw);
   const sources=await page.locator('main a[href]').evaluateAll(links=>links.map(link=>link.href));
   assert.ok(sources.every(url=>!url.includes("WZEK0040")&&!url.includes("/api/v2/documents/")&&!url.toLowerCase().includes(".zip")));
   const cf=page.locator("section").filter({has:page.getByRole("heading",{name:"キャッシュフロー",exact:true})});
   await cf.locator("details > summary").first().click();
   const details=await cf.innerText();assert.ok(details.includes("FACT"));assert.ok(details.includes("CALCULATION"));assert.ok(details.includes("文書ID"));
   await cf.locator("details > summary").first().click();
   const finance=page.locator("section").filter({has:page.getByRole("heading",{name:"財務",exact:true})});
   const financeClosed=await finance.innerText();assert.ok(financeClosed.includes(toyota?"43兆2054億円":"1兆2531億円"));
   assert.ok(!financeClosed.includes("Current Debt"));assert.ok(!financeClosed.includes("金融事業"));
   if(!toyota)assert.ok(financeClosed.includes("構成要素から算出"));
   await finance.locator("details > summary").first().click();const debtDetails=await finance.innerText();
   assert.ok(debtDetails.includes(debt.debt.sourceType));assert.ok(debtDetails.includes("重複確認：NO"));
   if(toyota){assert.ok(debtDetails.includes("金融事業"));assert.ok(debtDetails.includes("自動車等"));}
   await finance.locator("details > summary").first().click();
   if(input==="7203"||input==="285A"){await finance.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,"debt-"+input+"-finance-375.png")});}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   results.push({input,status:"PASS",symbol:report.symbol,fiscalDate:report.metadata.fiscalDate,researchStatus:report.researchStatus.status,debtValue:expectedDebt,debtSourceType:debt.debt.sourceType});
   if(input==="7203"||input==="285A"){fs.writeFileSync(path.join(output,"japan-publication-"+input+"-report.json"),JSON.stringify(report,null,2));await page.locator("[data-research-status]").scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,"research-status-"+input+"-375.png")});}
  }
  for(const input of ["NVDA","NVIDIA","AAPL","Apple","MSFT","GOOGL","UNKNOWNZZZ"]){
   await page.goto(base+"/stock-analysis/analyze/?"+new URLSearchParams({symbol:input}),{waitUntil:"networkidle"});
   await page.getByText(/米国株の一次資料接続は現在メンテナンス中/).first().waitFor();
   const result=reports.get(input);assert.equal(result.httpStatus,503);assert.equal(result.code,"US_PRIMARY_SOURCE_TEMPORARILY_UNAVAILABLE");assert.equal(result.status,"unavailable");
   assert.equal(await page.getByRole("button",{name:"再試行",exact:true}).count(),0);assert.equal(await page.locator("main h2").count(),1);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));results.push({input,status:"US_DISABLED_PASS"});
   if(input==="NVDA")await page.screenshot({path:path.join(output,"japan-publication-US-disabled-375.png")});
  }
  await page.goto(base+"/stock-analysis/analyze/?symbol=9999.JP",{waitUntil:"networkidle"});
  await page.getByText(/対応する日本・米国の普通株を確認できませんでした/).waitFor();assert.equal(reports.get("9999.JP").code,"SYMBOL_NOT_FOUND");results.push({input:"9999.JP",status:"PROPER_NOT_FOUND"});
  for(const [a,b,japanCount]of [["7203","285A",2],["7203","NVDA",1],["NVDA","AAPL",0]]){
   await page.goto(base+"/stock-analysis/compare/?"+new URLSearchParams({a,b}),{waitUntil:"networkidle"});
   await page.waitForFunction(()=>!document.body.textContent.includes("企業データを取得・照合しています"),{timeout:65000});
   const body=await page.locator("main").innerText();if(japanCount)assert.ok(body.includes("2026年3月期"));
   if(japanCount<2)assert.ok(body.includes("米国株の一次資料接続は現在メンテナンス中"));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));results.push({comparison:a+" vs "+b,status:"PASS"});
  }
  await page.goto(base+"/stock-analysis/watchlist/",{waitUntil:"networkidle"});
  await page.getByText("トヨタ自動車株式会社",{exact:true}).waitFor();await page.getByText("NVDA.US",{exact:true}).waitFor();
  await page.getByText(/米国株の一次資料接続は現在メンテナンス中/).first().waitFor();results.push({flow:"MIXED_WATCHLIST",status:"PASS"});
  for(const input of ["7203","NVDA"]){
   await page.goto(base+"/stock-analysis/emerging-growth/?"+new URLSearchParams({symbol:input}),{waitUntil:"networkidle"});
   if(input==="7203")await page.getByRole("link",{name:"完全分析・Counter-thesisを見る",exact:true}).waitFor();
   else await page.getByText(/米国株の一次資料接続は現在メンテナンス中/).first().waitFor();
   results.push({flow:"EMERGING "+input,status:"PASS"});
  }
  const routes=["/","/stock-analysis/","/stock-analysis/analyze/?symbol=7203","/stock-analysis/watchlist/","/stock-analysis/emerging-growth/?symbol=NVDA","/stock-analysis/compare/?a=7203&b=285A","/manifesto/","/brokers/","/indicator/","/framework/structure-theory/"];
  for(const width of [320,375,768,1280]){
   await page.setViewportSize({width,height:900});
   for(const route of routes){
    assert.equal((await page.goto(base+route,{waitUntil:"networkidle"})).status(),200);
    if(route.includes("analyze")||route.includes("compare"))await page.waitForFunction(()=>!document.body.textContent.includes("企業データを取得・照合しています"));
    const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
    if(route==="/framework/structure-theory/"&&width===768)assert.equal(scrollWidth,832);
    else if(route==="/manifesto/"&&width===1280)assert.equal(scrollWidth,1312);
    else assert.ok(scrollWidth<=width,"New horizontal overflow");
   }
   results.push({regressionWidth:width,routes:routes.length,status:"PASS",preservedKnownOverflow:width===768||width===1280});
  }
  await page.goto(base+"/");assert.deepEqual((await page.locator("main h2").allTextContents()).slice(0,4),["FX会社を選ぶ","TUTTO 株式分析","インジケーター","TUTTOは投資助言ではありません。"]);

  // Explicit TEST DATA UI cases only. Actual EDINET E2E above is independent and must pass first.
  const {evaluateResearchStatus}=require("../../lib/research-status.ts");
  const testCondition=()=>({state:"MET",reason:"TEST DATA attestation",evidenceRefs:["TEST DATA"]});
  const testBase={provider:"READY",identity:"VERIFIED",latestAnnual:"AVAILABLE",primaryEvidence:"AVAILABLE",dataIntegrity:"VALID",
   debt:"AVAILABLE",operatingCF:"AVAILABLE",freeCF:"AVAILABLE",cashFlowMissingSeverity:"NOT_MAJOR",
   majorRisk:"CLEAR",counterThesisMajorRisk:"CLEAR",valuation:"AVAILABLE",growthMode:"STANDARD",sourceFiscalYear:"2026-03-31",
   conditions:Object.fromEntries(["business","financials","cashFlow","balanceSheet","risk","counterThesis","valuation","growth"].map(key=>[key,testCondition()])),
   ownerDecisionsRequired:[]};
  for(const [expected,patch]of [["GREEN",{}],["STAY",{valuation:"MISSING"}],["GRAY",{debt:"MISSING"}]]){
   const report={...reports.get("285A").report,companyName:"TEST DATA — Status rendering only",researchStatus:evaluateResearchStatus({...testBase,...patch})};
   await page.route("**/api/stock-analysis/analyze",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({status:"ready",report})}));
   await page.setViewportSize({width:375,height:900});
   await page.goto(base+"/stock-analysis/analyze/?symbol=TEST",{waitUntil:"networkidle"});
   await page.locator('[data-research-status="'+expected+'"]').waitFor();
   assert.ok((await page.locator("main").innerText()).includes("TEST DATA"));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator("[data-research-status]").scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(output,"TEST-DATA-status-"+expected+"-375.png")});
   results.push({testDataOnly:true,statusUI:expected,status:"PASS"});
   await page.unroute("**/api/stock-analysis/analyze");
  }

  assert.deepEqual(errors,[]);assert.equal(secCalls,0);
  const report={testedAt:new Date().toISOString(),results,browserErrors:errors,secLiveRequests:secCalls,edinetRequests:requests};
  const text=JSON.stringify(report,null,2);for(const secret of [env.EDINET_API_KEY,env.SEC_CONTACT_EMAIL])if(secret)assert.ok(!text.includes(secret),"Private value in audit output");
  fs.writeFileSync(path.join(output,"research-status-live-browser-results.json"),text);
  console.log(JSON.stringify({cases:results.length,secLiveRequests:secCalls,browserErrors:errors.length,status:"PASS",JapanFiscalEnd:"2026-03-31",regressionWidths:[320,375,768,1280]}));
 }finally{global.fetch=originalFetch;if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{let message=String(error.message??"Browser verification failed");for(const secret of [env.EDINET_API_KEY,env.SEC_CONTACT_EMAIL])if(secret)message=message.split(secret).join("[REDACTED]");console.error(message.slice(0,1500));process.exitCode=1;});
