// Live browser verification: no mocked provider, no snapshot fallback, no production fixtures.
// Set SEC_CONTACT_EMAIL / EDINET_API_KEY via the environment or ignored local .dev.vars.
require("./register.cjs");
const fs=require("node:fs"),path=require("node:path"),http=require("node:http"),assert=require("node:assert/strict");
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||"playwright");
const {onRequest}=require("../../functions/api/stock-analysis/[[path]].ts");
const root=path.resolve(__dirname,"../.."),output=path.join(root,".stock-test-output");
fs.mkdirSync(output,{recursive:true});
const env={STOCK_DATA_MODE:"FREE",SEC_CONTACT_EMAIL:process.env.SEC_CONTACT_EMAIL,EDINET_API_KEY:process.env.EDINET_API_KEY,
 TUTTO_WATCHLIST_SYMBOLS:"NVDA.US,AAPL.US",STOCK_RATE_LIMITER:{limit:async()=>({success:true})}};
const vars=path.join(root,".dev.vars");if(fs.existsSync(vars))for(const line of fs.readFileSync(vars,"utf8").split(/\r?\n/)){
 const match=/^(SEC_CONTACT_EMAIL|EDINET_API_KEY)=(.*)$/.exec(line);if(match && !env[match[1]])env[match[1]]=match[2].trim().replace(/^(['"])(.*)\1$/,"$2");
}
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png"};
const reports=new Map(),results=[],errors=[];
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,"http://127.0.0.1:"+server.address().port);
  if(url.pathname.startsWith("/api/stock-analysis/")){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);const headers=new Headers();
   for(const [key,value]of Object.entries(req.headers))if(typeof value==="string")headers.set(key,value);
   const request=new Request(url,{method:req.method,headers,body:req.method==="GET"?undefined:Buffer.concat(chunks)});
   const response=await onRequest({request,env}),bytes=Buffer.from(await response.arrayBuffer());
   if(url.pathname.endsWith("/analyze")){const input=JSON.parse(Buffer.concat(chunks).toString()).input;reports.set(input,{httpStatus:response.status,...JSON.parse(bytes)});}
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(bytes);return;
  }
  const out=path.join(root,"out");let file=path.resolve(out,"."+decodeURIComponent(url.pathname));
  if(!file.startsWith(out+path.sep) && file!==out){res.writeHead(403).end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,"index.html");
  if(!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader("Content-Type",mime[path.extname(file)]||"application/octet-stream");res.end(fs.readFileSync(file));
 }catch{res.writeHead(500).end("Local verification server error");}
});
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));const base="http://127.0.0.1:"+server.address().port;
  browser=await chromium.launch({headless:true,channel:"chrome"});const page=await browser.newPage({viewport:{width:375,height:900}});
  page.on("pageerror",error=>errors.push(error.message));await page.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  for(const input of ["NVDA","AAPL","7203","285A"]){
   await page.goto(base+"/stock-analysis/analyze/?"+new URLSearchParams({symbol:input}),{waitUntil:"networkidle"});
   await page.waitForFunction(()=>!document.querySelector('[role="status"]')?.textContent.includes("取得・照合しています"),{timeout:65000});
   let response=reports.get(input);assert.ok(response,"No browser-to-handler response");
   if(response.code==="AMBIGUOUS_SYMBOL" && response.candidates?.length===1 && response.candidates[0].exchange==="JP"){
    const selected=response.candidates[0].symbol;
    const completed=page.waitForResponse(res=>res.url().endsWith("/analyze") && res.request().postDataJSON()?.input===selected,{timeout:65000});
    await page.getByRole("button",{name:new RegExp(selected.replace(".","\\."))}).click();await completed;
    await page.waitForURL(url=>url.searchParams.get("symbol")===selected);await page.waitForFunction(()=>!document.querySelector('[role="status"]')?.textContent.includes("取得・照合しています"));await page.waitForTimeout(500);
    response=reports.get(selected);assert.ok(response);
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(response.status==="ready"){
    const report=response.report;assert.equal(report.metadata.mode,"FREE");assert.equal(report.metadata.valuationStatus,"LIMITED");
    assert.equal(Object.keys(report.sections).length,12);assert.equal(await page.locator("main h2").count(),13);
    assert.ok((report.sections.performance??[]).some(item=>item.kind==="FACT" && item.label==="Revenue"));
    await page.getByText("FACT",{exact:true}).first().waitFor();await page.getByText("CALCULATION",{exact:true}).first().waitFor();
    await page.getByText("VALUATION_STATUS = LIMITED",{exact:false}).first().waitFor();await page.getByText("Counter-Thesis（必須）",{exact:false}).first().waitFor();
    fs.writeFileSync(path.join(output,"live-free-"+input+"-report.json"),JSON.stringify(report,null,2));
    results.push({input,status:"PASS",provider:report.metadata.provider,fiscalDate:report.metadata.fiscalDate});
   }else{
    await page.getByRole("button",{name:"再試行",exact:true}).waitFor();assert.ok(["CONFIGURATION_REQUIRED","RATE_LIMITED","DATA_PROVIDER_ERROR","FINANCIALS_UNAVAILABLE"].includes(response.code));
    results.push({input,status:"BLOCKED",code:response.code,message:response.message});
   }
   await page.screenshot({path:path.join(output,"live-free-"+input+"-mobile.png")});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,"live-free-results.json"),JSON.stringify({testedAt:new Date().toISOString(),results,browserErrors:errors},null,2));
  console.log(JSON.stringify(results,null,2));console.log("Browser error/retry UI and 375px overflow checks: PASS");
  if(results.some(result=>result.status!=="PASS"))process.exitCode=2;
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{let message=String(error.message??"Live browser verification failed");for(const secret of [env.EDINET_API_KEY,env.SEC_CONTACT_EMAIL])if(secret)message=message.split(secret).join("[REDACTED]");console.error(message.slice(0,1600));process.exitCode=1;});
