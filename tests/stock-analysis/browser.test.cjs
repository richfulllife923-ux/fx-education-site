// TEST DATA integration harness. No provider credentials, no production fixture route.
require("./register.cjs");
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),http=require("node:http");
const {execFileSync}=require("node:child_process");
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||"playwright");
const {mockFetch}=require("./fixtures.cjs");
const {onRequest}=require("../../functions/api/stock-analysis/[[path]].ts");
const root=path.resolve(__dirname,"../.."),output=path.join(root,".stock-test-output");
fs.mkdirSync(output,{recursive:true});
const results=[],errors=[],nativeFetch=global.fetch;
let mode="unconfigured",requestId=0;
const fixtureFetch=mockFetch();
global.fetch=async(url,options)=>{
  const parsed=new URL(url);
  if(parsed.hostname!=="eodhd.com")return nativeFetch(url,options);
  if(mode==="partial")return mockFetch({fail:["real-time","calendar/earnings"]})(url,options);
  if(parsed.pathname.endsWith("/search/AMBIGUOUS"))return new Response(JSON.stringify([
    {Code:"NVDA",Name:"NVIDIA [TEST DATA]",Exchange:"US",Type:"Common Stock",Country:"USA",Currency:"USD"},
    {Code:"AAPL",Name:"Apple [TEST DATA]",Exchange:"US",Type:"Common Stock",Country:"USA",Currency:"USD"}
  ].filter(item=>item.Exchange===parsed.searchParams.get("exchange"))),{headers:{"Content-Type":"application/json"}});
  return fixtureFetch(url,options);
};
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".json":"application/json"};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,"http://127.0.0.1:"+server.address().port);
  if(url.pathname.startsWith("/api/stock-analysis/")){
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const headers=new Headers();Object.entries(req.headers).forEach(([name,value])=>{if(typeof value==="string")headers.set(name,value);});
    headers.set("CF-Connecting-IP","TEST_DATA_"+(++requestId));
    const request=new Request(url,{method:req.method,headers,body:req.method==="GET"?undefined:Buffer.concat(chunks)});
    const env=mode==="unconfigured"?{STOCK_DATA_MODE:"EODHD"}:{STOCK_DATA_MODE:"EODHD",SEC_LIVE_ENABLED:"true",SEC_PUBLIC_RELEASE_APPROVED:"true",EODHD_API_KEY:"TEST_DATA_ONLY_"+mode,EODHD_PUBLIC_DISPLAY_APPROVED:"true",EODHD_CACHE_APPROVED:"true",TUTTO_WATCHLIST_SYMBOLS:"7203.TSE,NVDA.US"};
    const response=await onRequest({request,env});
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  const requestPath=decodeURIComponent(url.pathname),out=path.join(root,"out");
  let file=path.resolve(out,"."+requestPath);
  if(file!==out && !file.startsWith(out+path.sep)){res.writeHead(403).end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,"index.html");
  if(!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader("Content-Type",mime[path.extname(file)]||"application/octet-stream");res.end(fs.readFileSync(file));
 }catch(error){res.writeHead(500).end("TEST HARNESS ERROR");console.error(error);}
});
(async()=>{
 let browser;
 try{
  const protectedPaths=["app/page.tsx","app/indicator","app/framework","app/manifesto","app/brokers","components/Header.tsx","components/Footer.tsx","app/globals.css","package.json","package-lock.json","next.config.mjs"];
  assert.equal(execFileSync("git",["diff","--name-only","--",...protectedPaths],{cwd:root,encoding:"utf8"}).trim(),"");
  results.push("Protected pages, shared styles, routes and package configuration: PASS");
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));const base="http://127.0.0.1:"+server.address().port;
  browser=await chromium.launch({headless:true,channel:"chrome"});
  const page=await browser.newPage();await page.addInitScript(()=>{window.__stockTestInjected=false;window.alert=()=>{window.__stockTestInjected=true;};});page.on("pageerror",error=>errors.push(error.message));
  await page.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const routes=["/","/stock-analysis/","/stock-analysis/analyze/?symbol=7203","/stock-analysis/watchlist/","/stock-analysis/emerging-growth/","/stock-analysis/compare/?a=7203&b=NVDA","/indicator/","/manifesto/","/brokers/","/framework/structure-theory/"];
  for(const width of [320,375,768,1280]){
    await page.setViewportSize({width,height:900});
    for(const route of routes){
      assert.equal((await page.goto(base+route,{waitUntil:"networkidle"})).status(),200);
      const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
      if(route==="/framework/structure-theory/" && width===768){assert.equal(scrollWidth,832);results.push("Framework 768px: existing published 832px overflow reproduced; protected source unchanged");}
      else if(route==="/manifesto/" && width===1280){assert.equal(scrollWidth,1312);results.push("Manifesto 1280px: existing published 1312px overflow reproduced; protected source unchanged");}
      else assert.ok(scrollWidth<=width,route+" overflow at "+width);
    }
    results.push("10 routes / no NEW horizontal overflow at "+width+"px: PASS");
  }
  await page.goto(base+"/");assert.deepEqual((await page.locator("main h2").allTextContents()).slice(0,4),["TUTTO Manifesto","FX会社を選ぶ","TUTTO 株式分析","インジケーター"]);
  await page.goto(base+"/stock-analysis/");const input=page.getByLabel("銘柄名・証券コード・Ticker",{exact:true});
  await input.fill("  ");await input.press("Enter");await page.getByText("銘柄名・証券コード・Tickerを入力してください。",{exact:true}).waitFor();
  await input.fill("トヨタ");await input.press("Enter");await page.waitForURL(url=>url.searchParams.get("symbol")==="トヨタ");
  await page.getByText(/分析データの公開利用権限またはサーバーの秘密鍵が未設定/).waitFor();
  await page.getByRole("button",{name:"再試行",exact:true}).click();
  await page.getByText(/企業データは取得していません/).waitFor();
  results.push("Unconfigured API, empty input, Japanese Enter navigation and retry: PASS");
  mode="fixtures";
  for(const symbol of ["7203","NVDA","285A","AAPL"]){
    await page.goto(base+"/stock-analysis/analyze/?"+new URLSearchParams({symbol}),{waitUntil:"networkidle"});
    await page.getByText(/TEST DATA/).first().waitFor();
    assert.equal(await page.locator("main h2").count(),13);
    await page.getByText("Counter-Thesis（必須）",{exact:false}).first().waitFor();
    await page.getByText("SOURCE CLAIM",{exact:true}).first().waitFor();
    assert.ok(await page.getByText("CALCULATION",{exact:true}).count()>0);
  }
  results.push("TEST DATA browser → Pages handler → real adapter normalization → engine → 12-section UI for 7203/NVDA/285A/AAPL: PASS (not live E2E)");
  for(const width of [320,375,768,1280]){
    await page.setViewportSize({width,height:900});
    for(const route of ["/stock-analysis/analyze/?symbol=NVDA","/stock-analysis/compare/?a=7203&b=NVDA","/stock-analysis/emerging-growth/?symbol=285A","/stock-analysis/watchlist/"]){
      await page.goto(base+route,{waitUntil:"networkidle"});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+" TEST DATA overflow at "+width);
    }
  }
  results.push("Loaded TEST DATA analysis/compare/emerging/watchlist at 4 widths: PASS");
  await page.goto(base+"/stock-analysis/compare/?a=7203&b=NVDA",{waitUntil:"networkidle"});
  await page.getByText(/財務通貨が一致しない/).waitFor();
  await page.getByLabel("銘柄A",{exact:true}).fill("NVDA");await page.getByLabel("銘柄B",{exact:true}).fill("nvda");
  await page.getByLabel("銘柄B",{exact:true}).press("Enter");await page.getByText("異なる2銘柄を入力してください。",{exact:true}).waitFor();
  results.push("Comparison duplicate rejection, sourced results and currency warning: PASS");
  await page.goto(base+"/stock-analysis/analyze/?symbol=AMBIGUOUS",{waitUntil:"networkidle"});
  await page.getByRole("button",{name:/NVIDIA.*NVDA.US/}).click();await page.waitForURL(url=>url.searchParams.get("symbol")==="NVDA.US");
  await page.getByText(/NVIDIA Corporation \[TEST DATA\]/).first().waitFor();
  results.push("Ambiguous candidate selection and re-analysis: PASS");
  mode="partial";
  await page.goto(base+"/stock-analysis/analyze/?symbol=NVDA",{waitUntil:"networkidle"});
  await page.getByText(/PARTIAL_DATA/).waitFor();
  assert.equal(await page.locator("main h2").count(),13);
  await page.setViewportSize({width:375,height:900});await page.screenshot({path:path.join(output,"partial-mobile.png")});
  results.push("Partial-data warning keeps financial results and sections visible: PASS");
  mode="fixtures";
  await page.goto(base+"/stock-analysis/emerging-growth/?symbol=285A",{waitUntil:"networkidle"});
  await page.getByText(/分類・認知段階は未確認/).waitFor();
  await page.screenshot({path:path.join(output,"emerging-mobile.png"),fullPage:true});
  await page.goto(base+"/stock-analysis/watchlist/",{waitUntil:"networkidle"});await page.getByText("Risk / Counter-thesis：",{exact:false}).first().waitFor();
  await page.screenshot({path:path.join(output,"watchlist-mobile.png")});
  await page.goto(base+"/stock-analysis/");await input.focus();
  assert.notEqual(await input.evaluate(node=>getComputedStyle(node).outlineStyle),"none");
  for(const button of await page.locator(".main-cta").evaluateAll(nodes=>nodes.map(node=>({height:node.getBoundingClientRect().height,color:getComputedStyle(node).color})))) {
    assert.ok(button.height>=48);assert.equal(button.color,"rgb(255, 255, 255)");
  }
  results.push("Emerging evidence/missing confirmation, owner watchlist, keyboard focus and CTA: PASS");
  await page.goto(base+"/stock-analysis/analyze/?"+new URLSearchParams({symbol:"A&B / <script>alert(1)</script>"}),{waitUntil:"networkidle"});
  await page.getByText(/対応する日本・米国の普通株を確認できません/).waitFor();
  assert.equal(await page.evaluate(()=>window.__stockTestInjected),false);
  assert.deepEqual(errors,[]);results.push("Escaped input and browser runtime errors: PASS / NONE");
  fs.writeFileSync(path.join(output,"browser-results.txt"),results.join("\n")+"\n");
  console.log(results.join("\n"));
 } finally {global.fetch=nativeFetch;if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
