// Browser QA only. Explicit TEST DATA remains private, never imported by production.
require('./register.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {snapshot}=require('./growth-pipeline-fixtures.cjs');
const {createPreview}=require('../../scripts/preview-growth-radar.cjs');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'.stock-test-output','growth-radar-hp');
const file=path.join(out,'browser-TEST-DATA-snapshot.json'),results=[],errors=[],consoleErrors=[];
const widths=[1280,768,375];
(async()=>{
 let browser,server;
 try{
  fs.mkdirSync(out,{recursive:true});server=createPreview(file,{delay:600});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('502'))consoleErrors.push(m.text());});
  // Local telemetry isolation only. App API goes to real handler/store; it is never intercepted.
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='static.cloudflareinsights.com')return r.fulfill({status:200,contentType:'text/javascript',body:''});return u.origin===base?r.continue():r.abort();});
  for(const width of widths){
   await page.setViewportSize({width,height:900});
   for(const count of [0,1,2,3,4]){
    fs.writeFileSync(file,JSON.stringify(snapshot(count)));await page.goto(base+'/stock-analysis/watchlist/',{waitUntil:'domcontentloaded'});
    const region=page.locator('[data-featured-candidates]');await region.locator('text=候補データを確認中').waitFor();
    await page.waitForFunction(()=>document.querySelector('[data-featured-candidates]')?.getAttribute('data-featured-state')!=='LOADING');
    const expected=count>3?0:count;assert.equal(await region.locator('article').count(),expected);
    assert.equal(await region.getAttribute('data-featured-state'),count===0?'NO_QUALIFIED_CANDIDATES':count>3?'VERIFYING':'READY');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
    assert.equal(await page.locator('footer').count(),1);
    if(expected){
     assert.equal(await region.getByRole('progressbar',{name:'Evidence Coverage'}).count(),expected);
     assert.equal(await region.getByText('未算定',{exact:true}).count(),expected);
     assert.equal(await region.getByRole('link',{name:'詳しく分析する'}).count(),expected);
     const geometry=await region.locator('article').evaluateAll(cards=>cards.map(c=>{const r=c.getBoundingClientRect(),title=c.querySelector('h2'),t=title.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,width:r.width,titleFits:title.scrollWidth<=title.clientWidth&&t.left>=r.left&&t.right<=r.right};}));
     assert.ok(geometry.every(g=>g.titleFits));if(width===375){assert.ok(geometry.every(g=>g.left===geometry[0].left));assert.ok(geometry[0].top<900,'first card visible without scrolling');}
     for(const a of await region.getByRole('link',{name:'詳しく分析する'}).all())assert.match(await a.getAttribute('href'),/^\/stock-analysis\/analyze\/\?symbol=/);
    }
    if(count===3||count===0){await page.screenshot({path:path.join(out,'watchlist-TEST-DATA-'+count+'-cards-'+width+'.png'),fullPage:true});if(count===3)await region.screenshot({path:path.join(out,'cards-TEST-DATA-'+width+'.png')});}
    results.push({width,count,expected,state:await region.getAttribute('data-featured-state'),horizontalScroll:false,result:'PASS'});
   }
  }
  // Long company name / exact quote must wrap without clipping at 375px.
  const long=snapshot();long.selectionRun.audits[0].report.companyName='TEST DATA 非常に長い会社名・構造変化と企業研究のための株式会社'.repeat(4);
  for(const e of long.selectionRun.audits[0].report.sections.performance)e.value='TEST DATA 長いWhy Nowの改行確認。'.repeat(30);
  fs.writeFileSync(file,JSON.stringify(long));await page.setViewportSize({width:375,height:900});await page.reload();await page.locator('[data-featured-state="READY"]').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));results.push({case:'long company name',result:'PASS'});
  // Corrupt persisted JSON surfaces ERROR, never the formal zero state; retry can recover.
  fs.writeFileSync(file,'{INVALID');await page.reload();await page.locator('[data-featured-state="ERROR"]').waitFor();
  assert.equal(await page.locator('[data-featured-candidates]').getByRole('alert').innerText(),'現在、候補データを取得できません。');await page.screenshot({path:path.join(out,'watchlist-error-375.png'),fullPage:true});
  fs.writeFileSync(file,JSON.stringify(snapshot(1)));await page.getByRole('button',{name:'再確認'}).click();await page.locator('[data-featured-state="READY"]').waitFor();results.push({case:'error and retry',result:'PASS'});
  const realFile=path.join(out,'real-replay-snapshot.json');fs.writeFileSync(file,fs.readFileSync(realFile));await page.reload();await page.locator('[data-featured-state="VERIFYING"]').waitFor();
  assert.equal(await page.locator('[data-featured-candidates] article').count(),0);await page.screenshot({path:path.join(out,'watchlist-real-evidence-verifying-375.png'),fullPage:true});results.push({case:'real saved evidence no fabricated candidate',result:'PASS'});
  for(const width of widths){
   await page.setViewportSize({width,height:900});await page.goto(base+'/stock-analysis/',{waitUntil:'networkidle'});
   assert.equal(await page.locator('main').count(),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   results.push({case:'stock-analysis landing',width,result:'PASS'});
  }
  // Analysis detail separately replays the saved official report; this is NOT a live provider check.
  const replay=JSON.parse(fs.readFileSync(realFile,'utf8')).selectionRun.audits[0].report;
  await page.route('**/api/stock-analysis/analyze',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({status:'ready',report:replay})}));
  for(const width of widths){
   await page.setViewportSize({width,height:900});await page.goto(base+'/stock-analysis/analyze/?symbol='+replay.symbol,{waitUntil:'networkidle'});
   await page.locator('[data-research-evidence]').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.equal(await page.locator('[data-research-evidence] [data-evidence-check]').count(),4);
   results.push({case:'analysis saved primary report replay',width,symbol:replay.symbol,result:'PASS',liveProvider:false});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
  fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({status:'PASS',featuredApiInterception:false,analysisApiReplay:true,savedStoreToRealApi:true,syntheticCasesLabeled:true,results,errors,consoleErrors},null,2));console.log(JSON.stringify({status:'PASS',cases:results.length,errors,consoleErrors}));
 }finally{await browser?.close();if(server)await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'browser-failure.json'),JSON.stringify({message:e.message,results,errors,consoleErrors},null,2));process.exitCode=1;});
