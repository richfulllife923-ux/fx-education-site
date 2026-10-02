require('./register.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict');
const {snapshot}=require('./growth-pipeline-fixtures.cjs');
const {onRequest}=require('../../functions/api/stock-analysis/[[path]].ts');
const {loadFeatured}=require('../../lib/featured-client.ts');
const {projectSnapshot}=require('../../server/stock-analysis/growth-radar/pipeline.ts');
const now=()=>new Date('2026-10-02T00:03:00Z');
const req=()=>new Request('https://tutto.test/api/stock-analysis/featured');
test('real public endpoint reads one snapshot and does not call providers',async()=>{
 let reads=0,requests=0;const before=global.fetch;global.fetch=async()=>{requests++;throw Error('Forbidden public acquisition');};
 try{const value=snapshot(),response=await onRequest({request:req(),env:{TOP3_RESEARCH_RUN:{get:async key=>{assert.equal(key,'top3-research-run');reads++;return value;}},STOCK_RATE_LIMITER:{limit:async()=>({success:true})}}});
 assert.equal(response.status,200);const data=await response.json();assert.equal(reads,1);assert.equal(requests,0);
 assert.equal(data.selectedCount,data.entries.length);assert.ok(!('selectionRun' in data));assert.ok(!('inputs' in data));
 }finally{global.fetch=before;}
});
test('storage failure and corrupted envelope return error instead of empty',async()=>{
 for(const get of [async()=>{throw Error('storage failed');},async()=>({version:'growth-radar-public/1'})]){
 const response=await onRequest({request:req(),env:{TOP3_RESEARCH_RUN:{get},STOCK_RATE_LIMITER:{limit:async()=>({success:true})}}});
 assert.equal(response.status,502);const body=await response.json();assert.equal(body.status,'error');assert.ok(!body.entries);
 }
});
test('client rejects padded, GRAY, malformed, and unsuccessful responses',async()=>{
 const before=global.fetch;
 try{
  const good=projectSnapshot(snapshot(),now);
  global.fetch=async()=>new Response(JSON.stringify(good));assert.equal((await loadFeatured(new AbortController().signal)).selectedCount,1);
  for(const change of [r=>r.selectedCount=3,r=>r.entries[0].researchStatus.status='GRAY',r=>r.entries[0].summaryScore.coverage=101,r=>r.uiState='NO_QUALIFIED_CANDIDATES']){
   const bad=structuredClone(good);change(bad);global.fetch=async()=>new Response(JSON.stringify(bad));await assert.rejects(loadFeatured(new AbortController().signal));
  }
  global.fetch=async()=>new Response('{}',{status:503});await assert.rejects(loadFeatured(new AbortController().signal));
 }finally{global.fetch=before;}
});
test('public refresh POST is not available',async()=>{
 const response=await onRequest({request:new Request(req().url,{method:'POST'}),env:{}});assert.equal(response.status,405);
});
